import { ConflictException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
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

@Injectable()
export class CustomerService implements OnApplicationBootstrap {

  private cachedCustomerCount: number;

  constructor(@InjectModel(Customer.name) private readonly customerModel: ReturnModelType<typeof Customer>,
              private readonly searchService: SearchService,
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
        .sort(spf.getSortAsObj(true))
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

    return found;
  }

  async createCustomer(customerDto: AdminAddOrUpdateCustomerDto, session?: ClientSession, migrate?): Promise<Customer> {
    const query: Partial<Customer> = { email: customerDto.email };
    const foundByEmail = await this.customerModel.findOne(query).exec();
    if (foundByEmail) {
      if (migrate) { // todo just throw err after migrate
        return foundByEmail;
      } else {
        throw new ConflictException(`Customer with email '${customerDto.email}' already exists`);
      }
    }

    const newCustomer = new this.customerModel(customerDto);
    if (!migrate || (migrate && !customerDto.id)) {
      newCustomer.id = await this.counterService.getCounter(Customer.collectionName, session);
    }

    await newCustomer.save({ session });
    this.addSearchData(newCustomer);
    this.updateCachedCustomerCount();

    return newCustomer;
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
}
