import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './models/customer.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/spf.dto';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto, AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { CounterService } from '../shared/counter/counter.service';
import { ClientSession } from 'mongoose';
import { Order } from '../order/models/order.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { SearchService } from '../shared/search/search.service';
import { ElasticCustomerModel } from './models/elastic-customer.model';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { plainToClass } from 'class-transformer';
import { hash } from 'bcrypt';
import { bcryptSaltRounds } from '../shared/constants';
import { ClientRegisterDto } from '../shared/dtos/client/register.dto';
import { AuthService } from '../auth/services/auth.service';
import { ResetPasswordDto } from '../shared/dtos/client/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class CustomerService implements OnApplicationBootstrap {

  private cachedCustomerCount: number;

  constructor(@InjectModel(Customer.name) private readonly customerModel: ReturnModelType<typeof Customer>,
              @Inject(forwardRef(() => AuthService)) private authService: AuthService,
              private readonly searchService: SearchService,
              private readonly emailService: EmailService,
              private counterService: CounterService) {
  }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Customer.collectionName, new ElasticCustomerModel());
  }

  async getCustomersList(spf: AdminSortingPaginatingFilterDto): Promise<ResponseDto<AdminCustomerDto[]>> {
    let customers: AdminCustomerDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      customers = searchResponse[0];
      itemsFiltered = searchResponse[1];

    } else {
      customers = await this.customerModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      customers = plainToClass(AdminCustomerDto, customers, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countCustomers();
    const pagesTotal = Math.ceil(itemsTotal / spf.limit);
    return {
      data: customers,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async getCustomerById(customerId: number): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    return found.toJSON();
  }

  async getCustomerByEmailOrPhoneNumber(emailOrPhone: string): Promise<Customer> {
    return this.customerModel
      .findOne({
        $or: [
          { email: emailOrPhone },
          { phoneNumber: emailOrPhone }
        ]
      })
      .exec();
  }

  private async createCustomer(customerDto: AdminAddOrUpdateCustomerDto, session?: ClientSession, migrate?): Promise<Customer> {
    const newCustomer = new this.customerModel(customerDto);
    if (!migrate || (migrate && !customerDto.id)) { // todo remove line after migrate
      newCustomer.id = await this.counterService.getCounter(Customer.collectionName, session);
    }

    await newCustomer.save({ session });
    this.addSearchData(newCustomer);
    this.updateCachedCustomerCount();

    return newCustomer.toJSON();
  }

  async adminCreateCustomer(customerDto: AdminAddOrUpdateCustomerDto, session?: ClientSession, migrate?): Promise<Customer> {
    const foundByEmail = await this.customerModel.findOne({ email: customerDto.email }).exec();
    if (foundByEmail) {
      if (migrate) { // todo just throw err after migrate
        return foundByEmail;
      } else {
        throw new ConflictException(`Customer with email '${customerDto.email}' already exists`);
      }
    }

    return this.createCustomer(customerDto, session, migrate);
  }

  async clientCreateCustomer(registerDto: ClientRegisterDto): Promise<Customer> {
    const foundByEmail = await this.customerModel.findOne({ email: registerDto.email }).exec();
    if (foundByEmail) {
      throw new ConflictException(`Customer with email '${registerDto.email}' already exists`);
    }

    this.validatePassword(registerDto.password);

    const adminCustomerDto = new AdminAddOrUpdateCustomerDto();
    adminCustomerDto.firstName = registerDto.firstName;
    adminCustomerDto.lastName = registerDto.lastName;
    adminCustomerDto.email = registerDto.email;
    adminCustomerDto.password = await hash(registerDto.password, bcryptSaltRounds);
    adminCustomerDto.lastLoggedIn = new Date();

    const created = await this.createCustomer(adminCustomerDto);

    const token = await this.authService.createCustomerEmailConfirmToken(created);
    this.emailService.sendRegisterSuccessEmail(created, token);

    return created;
  }

  async updateCustomer(customerId: number, customerDto: AdminAddOrUpdateCustomerDto): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    Object.keys(customerDto).forEach(key => found[key] = customerDto[key]);
    await found.save();
    this.updateSearchData(found);

    return found;
  }

  async addCustomerAddress(customerId: number, address: AdminShippingAddressDto, session: ClientSession): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).session(session).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    found.addresses.push(address);
    await found.save({ session });
    this.updateSearchData(found);

    return found;
  }

  async deleteCustomer(customerId: number): Promise<Customer> {
    const deleted = await this.customerModel.findByIdAndDelete(customerId).exec();
    if (!deleted) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    this.deleteSearchData(deleted);
    this.updateCachedCustomerCount();
    return deleted.toJSON();
  }

  async countCustomers(): Promise<number> {
    if (this.cachedCustomerCount >= 0) {
      return this.cachedCustomerCount;
    } else {
      return this.customerModel.estimatedDocumentCount().exec().then(count => this.cachedCustomerCount = count);
    }
  }

  private updateCachedCustomerCount() {
    this.customerModel.estimatedDocumentCount().exec()
      .then(count => this.cachedCustomerCount = count)
      .catch(_ => {});
  }

  async addOrderToCustomer(customerId: number, order: Order, session: ClientSession): Promise<Customer> {
    const orderIdsProp = getPropertyOf<Customer>('orderIds');

    const customer = await this.customerModel.findByIdAndUpdate(
      customerId,
      { $push: { [orderIdsProp]: order.id } },
      { new: true }
    ).session(session).exec();

    return customer;
  }

  async incrementTotalOrdersCost(customerId: number, order: Order, session: ClientSession): Promise<Customer> {
    const totalProp = getPropertyOf<Customer>('totalOrdersCost');

    const customer = await this.customerModel.findByIdAndUpdate(
      customerId,
      { $inc: { [totalProp]: order.totalItemsCost } },
      { new: true }
    ).session(session).exec();

    return customer;
  }

  async updateCounter() {
    const lastCustomer = await this.customerModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Customer.collectionName, lastCustomer.id);
  }

  private async addSearchData(customer: Customer) {
    const customerDto = plainToClass(AdminCustomerDto, customer, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Customer.collectionName, customer.id, customerDto);
  }

  private updateSearchData(customer: Customer): Promise<any> {
    const customerDto = plainToClass(AdminCustomerDto, customer, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Customer.collectionName, customer.id, customerDto);
  }

  private deleteSearchData(customer: Customer): Promise<any> {
    return this.searchService.deleteDocument(Customer.collectionName, customer.id);
  }

  private async searchByFilters(spf: AdminSortingPaginatingFilterDto) {
    return this.searchService.searchByFilters<AdminCustomerDto>(
      Customer.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit
    );
  }

  /**
   * @param password
   * @throws BadRequestException
   */
  private validatePassword(password: string): void {
    let errorMessage;

    if (password.length < 8) {
      errorMessage = `Password should be more than 8 symbols`;
    } else if (!password.match(/[A-Z]/g)) {
      errorMessage = `Password should contain at least one uppercase letter`;
    } else if (!password.match(/[a-z]/g)) {
      errorMessage = `Password should contain at least one lowercase letter`;
    } else if (!password.match(/[0-9]/g)) {
      errorMessage = `Password should contain at least one digit`;
    }

    if (errorMessage) {
      throw new BadRequestException(errorMessage);
    }
  }

  updateLastLoggedIn(id: number): void {
    const lastLoggedInProp: keyof Customer = 'lastLoggedIn';

    this.customerModel.findByIdAndUpdate(id, { [lastLoggedInProp]: new Date() }).exec();
  }

  async resetPasswordByDto(resetDto: ResetPasswordDto) {
    const customer = await this.getCustomerByEmailOrPhoneNumber(resetDto.login);
    if (!customer) {
      throw new NotFoundException(`Customer with login "${resetDto.login}" not found`);
    }

    return this.authService.initResetCustomerPassword(customer);
  }
}
