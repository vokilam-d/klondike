import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './models/customer.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { AdminAddOrUpdateCustomerDto, AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { CounterService } from '../shared/counter/counter.service';

@Injectable()
export class CustomerService {

  constructor(@InjectModel(Customer.name) private readonly customerModel: ReturnModelType<typeof Customer>,
              private counterService: CounterService) {
  }

  async getAllCustomers(sortingPaging: AdminSortingPaginatingDto = new AdminSortingPaginatingDto()): Promise<Customer[]> {
    const found = await this.customerModel
      .find()
      .sort(sortingPaging.sort)
      .skip(sortingPaging.skip)
      .limit(sortingPaging.limit)
      .exec();

    return found;
  }

  async getCustomerById(customerId: number): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    return found;
  }

  async createCustomer(customerDto: AdminAddOrUpdateCustomerDto): Promise<Customer> {
    const newCustomer = new this.customerModel(customerDto);
    newCustomer.id = await this.counterService.getCounter(Customer.collectionName);

    await newCustomer.save();

    return newCustomer;
  }

  async updateCustomer(customerId: number, customerDto: AdminAddOrUpdateCustomerDto): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    Object.keys(customerDto).forEach(key => found[key] = customerDto[key]);
    await found.save();

    return found;
  }

  async addCustomerAddress(customerId: number, address: AdminShippingAddressDto): Promise<Customer> {
    const found = await this.customerModel.findById(customerId).exec();
    if (!found) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    found.addresses.push(address);
    await found.save();

    return found;
  }

  async deleteCustomer(customerId: number): Promise<Customer> {
    const deleted = await this.customerModel.findByIdAndDelete(customerId).exec();
    if (!deleted) {
      throw new NotFoundException(`Customer with id '${customerId}' not found`);
    }

    return deleted;
  }

  countCustomers(): Promise<number> {
    return this.customerModel.estimatedDocumentCount().exec();
  }
}
