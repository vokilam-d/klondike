import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './models/customer.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';
import { AdminAddOrUpdateCustomerDto, AdminCustomerDto } from '../shared/dtos/admin/customer.dto';
import { CounterService } from '../shared/services/counter/counter.service';
import { ClientSession } from 'mongoose';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticCustomerModel } from './models/elastic-customer.model';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { ClientRegisterDto } from '../shared/dtos/client/register.dto';
import { AuthService } from '../auth/services/auth.service';
import { EmailService } from '../email/email.service';
import { ClientUpdateCustomerDto } from '../shared/dtos/client/update-customer.dto';
import { ClientUpdatePasswordDto } from '../shared/dtos/client/update-password.dto';
import { EncryptorService } from '../shared/services/encryptor/encryptor.service';
import { OrderItem } from '../order/models/order-item.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { InitResetPasswordDto } from '../shared/dtos/client/init-reset-password.dto';
import { ResetPasswordDto } from '../shared/dtos/client/reset-password.dto';
import { ShipmentAddressDto } from '../shared/dtos/shared-dtos/shipment-address.dto';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { areAddressesSame } from '../shared/helpers/are-addresses-same.function';
import { OrderService } from '../order/order.service';

@Injectable()
export class CustomerService implements OnApplicationBootstrap {

  private logger = new Logger(CustomerService.name);
  private cachedCustomerCount: number;

  constructor(@InjectModel(Customer.name) private readonly customerModel: ReturnModelType<typeof Customer>,
              @Inject(forwardRef(() => AuthService)) private authService: AuthService,
              @Inject(forwardRef(() => OrderService)) private orderService: OrderService,
              private readonly searchService: SearchService,
              private readonly encryptor: EncryptorService,
              private readonly emailService: EmailService,
              private readonly counterService: CounterService) {
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
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);
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
    if (!emailOrPhone) { return; }

    return this.customerModel
      .findOne({
        $or: [
          { email: emailOrPhone },
          { phoneNumber: emailOrPhone }
        ]
      })
      .exec();
  }

  async getCustomerByOauthId(oauthId: string): Promise<DocumentType<Customer>> {
    return this.customerModel.findOne({ oauthId }).exec();
  }

  private async createCustomer(customerDto: AdminAddOrUpdateCustomerDto, session?: ClientSession): Promise<Customer> {
    const newCustomer = new this.customerModel(customerDto);
    newCustomer.id = await this.counterService.getCounter(Customer.collectionName, session);

    await newCustomer.save({ session });
    this.addSearchData(newCustomer);
    this.updateCachedCustomerCount();

    return newCustomer.toJSON();
  }

  async adminCreateCustomer(customerDto: AdminAddOrUpdateCustomerDto, session?: ClientSession): Promise<Customer> {
    const foundByEmail = await this.customerModel.findOne({ email: customerDto.email }).exec();
    if (!customerDto.email && foundByEmail) {
      throw new ConflictException(__('Customer with email "$1" already exists', 'ru', customerDto.email));
    }

    return this.createCustomer(customerDto, session);
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
    adminCustomerDto.password = await this.encryptor.hash(registerDto.password);
    adminCustomerDto.lastLoggedIn = new Date();

    const created = await this.createCustomer(adminCustomerDto);

    const token = await this.authService.createCustomerEmailConfirmToken(created);
    this.emailService.sendRegisterSuccessEmail(created, token).then();

    return created;
  }

  createCustomerByThirdParty(oauthId: string, firstName: string, lastName: string, email: string): Promise<Customer> {
    const adminCustomerDto = new AdminAddOrUpdateCustomerDto();
    adminCustomerDto.oauthId = oauthId;
    adminCustomerDto.firstName = firstName;
    adminCustomerDto.lastName = lastName;
    if (email) {
      adminCustomerDto.email = email;
    }
    adminCustomerDto.password = '';
    adminCustomerDto.lastLoggedIn = new Date();

    adminCustomerDto.isEmailConfirmed = true;
    adminCustomerDto.isRegisteredByThirdParty = true;

    return this.createCustomer(adminCustomerDto);
  }

  async updateCustomerById(customerId: number, customerDto: AdminAddOrUpdateCustomerDto): Promise<Customer> {
    const session = await this.customerModel.db.startSession();
    session.startTransaction();

    try {
      const found = await this.customerModel.findById(customerId).session(session).exec();
      if (!found) {
        throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
      }

      await this.processEmailChange(found.email, customerDto.email, session);

      Object.keys(customerDto).forEach(key => found[key] = customerDto[key]);
      await found.save({ session });
      await session.commitTransaction();

      this.updateSearchData(found).then();

      return found;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }

  }

  async updateCustomerByClientDto(customer: DocumentType<Customer>, customerDto: ClientUpdateCustomerDto): Promise<Customer> {
    const session = await this.customerModel.db.startSession();
    session.startTransaction();

    try {
      await this.processEmailChange(customer.email, customerDto.email, session);

      Object.keys(customerDto).forEach(key => customer[key] = customerDto[key]);
      await customer.save({ session });
      await session.commitTransaction();

      this.updateSearchData(customer).then();

      return customer;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async checkAndUpdatePassword(customer: DocumentType<Customer>, passwordDto: ClientUpdatePasswordDto): Promise<Customer> {
    const isValidOldPassword = await this.encryptor.validate(passwordDto.currentPassword, customer.password);
    if (!isValidOldPassword) {
      throw new BadRequestException(__('Current password is not valid', 'ru'));
    }

    return this.updatePassword(customer, passwordDto.newPassword);
  }

  async updatePassword(customer: DocumentType<Customer>, newPassword: string) {
    customer.password = await this.encryptor.hash(newPassword);
    await customer.save();

    return customer;
  }

  async addAddressByCustomerId(customerId: number, address: ShipmentAddressDto, session: ClientSession): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Customer with id "$1" not found', 'ru', customerId));
    }

    return this.addCustomerAddress(found, address, session);
  }

  async addCustomerAddress(customer: DocumentType<Customer>, address: ShipmentAddressDto, session: ClientSession): Promise<Customer> {
    const hasSameAddress = customer.addresses.find(customerAddress => areAddressesSame(customerAddress, address));
    if (!hasSameAddress) {
      customer.addresses.push(address);
      await customer.save({ session });
      this.updateSearchData(customer).then();
    }

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

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  private updateCachedCustomerCount() {
    this.customerModel.estimatedDocumentCount().exec()
      .then(count => this.cachedCustomerCount = count)
      .catch(_ => {});
  }

  async addOrderToCustomer(customerId: number, orderId, session: ClientSession): Promise<Customer> {
    const orderIdsProp = getPropertyOf<Customer>('orderIds');

    const customer = await this.customerModel.findByIdAndUpdate(
      customerId,
      { $push: { [orderIdsProp]: orderId } },
      { new: true }
    ).session(session).exec();

    return customer;
  }

  async removeOrderFromCustomer(orderId: number, session: ClientSession): Promise<void> {
    const orderIdsProp = getPropertyOf<Customer>('orderIds');

    await this.customerModel.findOneAndUpdate(
      { [orderIdsProp]: orderId },
      { $pull: { [orderIdsProp]: orderId } }
    ).session(session).exec();
  }

  async incrementTotalOrdersCost(customerId: number, totalItemsCost: number, session: ClientSession): Promise<Customer> {
    const totalCostProp: keyof Customer = 'totalOrdersCost';
    const totalCountProp: keyof Customer = 'totalOrdersCount';

    const customer = await this.customerModel.findByIdAndUpdate(
      customerId,
      { $inc: { [totalCostProp]: totalItemsCost, [totalCountProp]: 1 } },
      { new: true }
    ).session(session).exec();

    return customer;
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
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticCustomerModel()
    );
  }

  updateLastLoggedIn(id: number): void {
    const lastLoggedInProp: keyof Customer = 'lastLoggedIn';

    this.customerModel
      .findByIdAndUpdate(id, { [lastLoggedInProp]: new Date() })
      .exec()
      .catch(ex => this.logger.error(`Could not update last logged in date:`, ex));
  }

  async initResetPassword(resetDto: InitResetPasswordDto) {
    const customer = await this.getCustomerByEmailOrPhoneNumber(resetDto.login);
    if (!customer) {
      throw new NotFoundException(__('Customer with login "$1" not found', 'ru', resetDto.login));
    }

    return this.authService.initResetCustomerPassword(customer);
  }

  async initEmailConfirmation(token: string) {
    const customerId = await this.authService.getCustomerIdByConfirmEmailToken(token);
    if (!customerId) {
      throw new BadRequestException(__('Confirm email link is invalid or expired', 'ru'));
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new BadRequestException(__('Confirm email link is invalid or expired', 'ru'));
    }

    await this.confirmCustomerEmail(customer);
    await this.authService.deleteConfirmEmailToken(token);
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const customerId: number = await this.authService.getCustomerIdByResetPasswordToken(resetDto.token);
    if (!customerId) {
      throw new BadRequestException(__('Reset password link is invalid or expired', 'ru'));
    }

    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new BadRequestException(__('Customer not found', 'ru'));
    }

    found.password = await this.encryptor.hash(resetDto.password);
    await found.save();
    this.authService.deleteResetPasswordToken(resetDto.token).catch();

    return true;
  }

  async sendEmailConfirmationEmail(customer: Customer) {
    if (customer.isEmailConfirmed) {
      throw new BadRequestException(__('Your email has been already confirmed', 'ru'));
    }

    const token = await this.authService.createCustomerEmailConfirmToken(customer);
    await this.emailService.sendEmailConfirmationEmail(customer, token);
  }

  async addShippingAddress(customer: DocumentType<Customer>, addressDto: ShipmentAddressDto): Promise<Customer> {
    if (addressDto.isDefault) {
      customer.addresses.forEach(address => address.isDefault = false);
    }
    customer.addresses.push(addressDto);
    await customer.save();
    return customer.toJSON();
  }

  async editShippingAddress(customer: DocumentType<Customer>, addressId: string, addressDto: ShipmentAddressDto): Promise<Customer> {
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
    if (foundIdx === -1) { return; }

    customer.cart.splice(foundIdx, 1);
    await customer.save();
  }

  async confirmCustomerEmail(customer: DocumentType<Customer>) {
    if (!customer.email || customer.isEmailConfirmed) { return; }

    customer.isEmailConfirmed = true;
    await customer.save();
  }

  async emptyCart(customer: DocumentType<Customer>, session: ClientSession): Promise<DocumentType<Customer>> {
    customer.cart = [];
    await customer.save({ session });

    return customer;
  }

  private async processEmailChange(oldEmail: string, newEmail: string, session: ClientSession): Promise<void> {
    if (oldEmail === newEmail) { return; }

    await this.orderService.changeCustomerEmail(oldEmail, newEmail, session);
  }
}
