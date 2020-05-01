import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './models/customer.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto } from '../shared/dtos/admin/customer.dto';
import { CounterService } from '../shared/services/counter/counter.service';
import { ClientSession } from 'mongoose';
import { Order } from '../order/models/order.model';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticCustomerModel } from './models/elastic-customer.model';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { ClientRegisterDto } from '../shared/dtos/client/register.dto';
import { AuthService } from '../auth/services/auth.service';
import { ResetPasswordDto } from '../shared/dtos/client/reset-password.dto';
import { EmailService } from '../email/email.service';
import { ShippingAddressDto } from '../shared/dtos/shared-dtos/shipping-address.dto';
import { ClientUpdateCustomerDto } from '../shared/dtos/client/update-customer.dto';
import { ClientUpdatePasswordDto } from '../shared/dtos/client/update-password.dto';
import { EncryptorService } from '../shared/services/encryptor/encryptor.service';
import { OrderItem } from '../order/models/order-item.model';
import { __ } from '../shared/helpers/translate/translate.function';

@Injectable()
export class CustomerService implements OnApplicationBootstrap {

  private cachedCustomerCount: number;

  constructor(@InjectModel(Customer.name) private readonly customerModel: ReturnModelType<typeof Customer>,
              @Inject(forwardRef(() => AuthService)) private authService: AuthService,
              private readonly searchService: SearchService,
              private readonly encryptor: EncryptorService,
              private readonly emailService: EmailService,
              private counterService: CounterService) {
  }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Customer.collectionName, new ElasticCustomerModel());
  }

  async getCustomersList(spf: AdminSPFDto): Promise<ResponseDto<AdminCustomerDto[]>> {
    let customers: AdminCustomerDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      customers = searchResponse[0];
      itemsFiltered = searchResponse[1];

    } else {
      const customerModels = await this.customerModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      customers = plainToClass(AdminCustomerDto, customerModels, { excludeExtraneousValues: true });
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

  async getCustomerById(customerId: number, serialized: boolean = true): Promise<Customer | DocumentType<Customer>> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
    }

    return serialized ? found.toJSON() : found;
  }

  async getCustomerByEmailOrPhoneNumber(emailOrPhone: string): Promise<DocumentType<Customer>> {
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
        throw new ConflictException(__('Customer with email "$1" already exists', 'ru', customerDto.email));
      }
    }

    return this.createCustomer(customerDto, session, migrate);
  }

  async clientRegisterCustomer(registerDto: ClientRegisterDto): Promise<Customer> {
    const foundByEmail = await this.customerModel.findOne({ email: registerDto.email }).exec();
    if (foundByEmail) {
      throw new ConflictException(__('Customer with email "$1" already exists', 'ru', registerDto.email));
    }

    const adminCustomerDto = new AdminAddOrUpdateCustomerDto();
    adminCustomerDto.firstName = registerDto.firstName;
    adminCustomerDto.lastName = registerDto.lastName;
    adminCustomerDto.email = registerDto.email;
    adminCustomerDto.password = await this.encryptor.hashPassword(registerDto.password);
    adminCustomerDto.lastLoggedIn = new Date();

    const created = await this.createCustomer(adminCustomerDto);

    const token = await this.authService.createCustomerEmailConfirmToken(created);
    this.emailService.sendRegisterSuccessEmail(created, token);

    return created;
  }

  createCustomerByThirdParty(firstName: string, lastName: string, email: string): Promise<Customer> {
    const adminCustomerDto = new AdminAddOrUpdateCustomerDto();
    adminCustomerDto.firstName = firstName;
    adminCustomerDto.lastName = lastName;
    adminCustomerDto.email = email;
    adminCustomerDto.password = '';
    adminCustomerDto.lastLoggedIn = new Date();

    adminCustomerDto.isRegisteredByThirdParty = true;

    return this.createCustomer(adminCustomerDto);
  }

  async updateCustomerById(customerId: number, customerDto: AdminAddOrUpdateCustomerDto): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
    }

    Object.keys(customerDto).forEach(key => found[key] = customerDto[key]);
    await found.save();
    this.updateSearchData(found);

    return found;
  }

  async updateCustomerByClientDto(customer: DocumentType<Customer>, customerDto: ClientUpdateCustomerDto): Promise<Customer> {
    Object.keys(customerDto).forEach(key => customer[key] = customerDto[key]);
    await customer.save();
    this.updateSearchData(customer);

    return customer;
  }

  async updatePassword(customer: DocumentType<Customer>, passwordDto: ClientUpdatePasswordDto): Promise<Customer> {
    const isValidOldPassword = await this.encryptor.validatePassword(passwordDto.currentPassword, customer.password);
    if (!isValidOldPassword) {
      throw new BadRequestException(__('Current password is not valid', 'ru'));
    }

    customer.password = await this.encryptor.hashPassword(passwordDto.newPassword);
    await customer.save();

    return customer;
  }

  async addCustomerAddressById(customerId: number, address: ShippingAddressDto, session: ClientSession): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
    }

    return this.addCustomerAddress(found, address, session);
  }

  async addCustomerAddress(customer: DocumentType<Customer>, address: ShippingAddressDto, session: ClientSession): Promise<Customer> {
    customer.addresses.push(address);
    await customer.save({ session });
    this.updateSearchData(customer);

    return customer;
  }

  async deleteCustomer(customerId: number): Promise<Customer> {
    const deleted = await this.customerModel.findByIdAndDelete(customerId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
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
    const totalCostProp: keyof Customer = 'totalOrdersCost';
    const totalCountProp: keyof Customer = 'totalOrdersCount';

    const customer = await this.customerModel.findByIdAndUpdate(
      customerId,
      { $inc: { [totalCostProp]: order.totalItemsCost, [totalCountProp]: 1 } },
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

  private async searchByFilters(spf: AdminSPFDto) {
    return this.searchService.searchByFilters<AdminCustomerDto>(
      Customer.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit
    );
  }

  updateLastLoggedIn(id: number): void {
    const lastLoggedInProp: keyof Customer = 'lastLoggedIn';

    this.customerModel.findByIdAndUpdate(id, { [lastLoggedInProp]: new Date() }).exec();
  }

  async resetPasswordByDto(resetDto: ResetPasswordDto) {
    const customer = await this.getCustomerByEmailOrPhoneNumber(resetDto.login);
    if (!customer) {
      throw new NotFoundException(__('Customer with login "$1" not found', 'ru', resetDto.login));
    }

    return this.authService.initResetCustomerPassword(customer);
  }

  async sendEmailConfirmationEmail(customer: Customer) {
    if (customer.isEmailConfirmed) {
      throw new BadRequestException(__('Your email has been already confirmed', 'ru'));
    }

    const token = await this.authService.createCustomerEmailConfirmToken(customer);
    this.emailService.sendEmailConfirmationEmail(customer, token);
  }

  async addShippingAddress(customer: DocumentType<Customer>, addressDto: ShippingAddressDto): Promise<Customer> {
    if (addressDto.isDefault) {
      customer.addresses.forEach(address => address.isDefault = false);
    }
    customer.addresses.push(addressDto);
    await customer.save();
    return customer.toJSON();
  }

  async editShippingAddress(customer: DocumentType<Customer>, addressId: string, addressDto: ShippingAddressDto): Promise<Customer> {
    const foundAddressIdx = customer.addresses.findIndex(address => address._id.equals(addressId));
    if (foundAddressIdx === -1) {
      throw new BadRequestException(__('No address with id "$1"', 'ru', addressId));
    }

    if (addressDto.isDefault) {
      customer.addresses.forEach(address => address.isDefault = false);
    }
    Object.keys(addressDto).forEach(key => customer.addresses[foundAddressIdx][key] = addressDto[key]);
    await customer.save();
    return customer.toJSON();
  }

  async upsertToCart(customer: DocumentType<Customer>, orderItem: OrderItem): Promise<DocumentType<Customer>> {
    const alreadyAddedIdx = customer.cart.findIndex(cartItem => cartItem.sku === orderItem.sku);
    if (alreadyAddedIdx === -1) {
      customer.cart.push(orderItem);
    } else {
      customer.cart[alreadyAddedIdx] = {
        ...customer.cart[alreadyAddedIdx],
        ...orderItem
      };
    }

    await customer.save();
    return customer;
  }

  async deleteFromCart(customer: DocumentType<Customer>, sku: string) {
    const foundIdx = customer.cart.findIndex(item => item.sku === sku);
    if (foundIdx !== -1) {
      customer.cart.splice(foundIdx, 1);
      await customer.save();
    }
  }
}
