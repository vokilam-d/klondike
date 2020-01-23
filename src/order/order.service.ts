import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { AdminAddOrUpdateOrderDto } from '../shared/dtos/admin/order.dto';
import { CounterService } from '../shared/counter/counter.service';
import { CustomerService } from '../customer/customer.service';
import { AdminAddOrUpdateCustomerDto, AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { InventoryService } from '../inventory/inventory.service';
import { EOrderStatus } from '../shared/enums/order-status.enum';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';

@Injectable()
export class OrderService {

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private counterService: CounterService,
              private inventoryService: InventoryService,
              private customerService: CustomerService) {
  }

  async getAllOrders(sortingPaging: AdminSortingPaginatingDto = new AdminSortingPaginatingDto()): Promise<Order[]> {
    const found = await this.orderModel
      .find()
      .sort(sortingPaging.sort)
      .skip(sortingPaging.skip)
      .limit(sortingPaging.limit)
      .exec();

    return found;
  }

  async getOrderById(orderId: number): Promise<Order> {
    const found = await this.orderModel.findById(orderId).exec();
    if (!found) {
      throw new NotFoundException(`Order with id '${orderId}' not found`);
    }

    return found;
  }

  async createOrder(orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      if (orderDto.customerId && orderDto.shouldSaveAddress) {
        await this.customerService.addCustomerAddress(orderDto.customerId, orderDto.address, session);

      } else if (!orderDto.customerId) {
        if (!orderDto.customerFirstName) { orderDto.customerFirstName = orderDto.address.firstName; }
        if (!orderDto.customerLastName) { orderDto.customerLastName = orderDto.address.lastName; }
        if (!orderDto.customerPhoneNumber) { orderDto.customerPhoneNumber = orderDto.address.phoneNumber; }

        const customer = new AdminAddOrUpdateCustomerDto();
        customer.firstName = orderDto.customerFirstName;
        customer.lastName = orderDto.customerLastName;
        customer.email = orderDto.customerEmail;
        customer.phoneNumber = orderDto.customerPhoneNumber;
        customer.addresses = [{ ...orderDto.address, isDefault: true }];

        const createdCustomer = await this.customerService.createCustomer(customer, session);

        orderDto.customerId = createdCustomer.id;
      }

      const newOrder = new this.orderModel(orderDto);
      newOrder.id = await this.counterService.getCounter(Order.collectionName, session);
      newOrder.createdDate = new Date();
      newOrder.status = EOrderStatus.NEW;
      newOrder.orderTotalPrice = newOrder.items.reduce((acc, item) => acc + item.totalCost, 0);

      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, newOrder.id, session);
      }

      await newOrder.save({ session });
      await session.commitTransaction();

      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async editOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const found = await this.orderModel.findById(orderId).session(session).exec();
      if (!found) {
        throw new NotFoundException(`Order with id '${orderId}' not found`);
      }

      if (found.status !== EOrderStatus.NEW && found.status !== EOrderStatus.STARTED) {
        throw new ForbiddenException(`Cannot edit order with status '${found.status}'`);
      }

      for (const item of found.items) {
        await this.inventoryService.retrieveFromOrderedBackToStock(item.sku, orderId, session);
      }

      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, orderId, session);
      }

      Object.keys(orderDto).forEach(key => found[key] = orderDto[key]);
      await found.save({ session });
      await session.commitTransaction();

      return found;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async editOrderAddress(orderId: number, addressDto: AdminShippingAddressDto): Promise<Order> {
    const addressProp = getPropertyOf<Order>('address');

    const updated = await this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: { [addressProp]: addressDto } },
      { new: true }
    ).exec();

    return updated;
  }

  countOrders(): Promise<number> {
    return this.orderModel.estimatedDocumentCount().exec();
  }

  async cancelOrder(orderId: number): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const found = await this.orderModel.findById(orderId).session(session).exec();
      if (!found) {
        throw new NotFoundException(`Order with id '${orderId}' not found`);
      }

      if (found.status !== EOrderStatus.NEW && found.status !== EOrderStatus.STARTED) {
        throw new ForbiddenException(`Cannot cancel order with status '${found.status}'`);
      }

      for (const item of found.items) {
        await this.inventoryService.retrieveFromOrderedBackToStock(item.sku, orderId, session);
      }
      found.status = EOrderStatus.CANCELED;

      await found.save({ session });
      await session.commitTransaction();

      return found;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async startOrder(orderId: number): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const found = await this.orderModel.findById(orderId).session(session).exec();
      if (!found) {
        throw new NotFoundException(`Order with id '${orderId}' not found`);
      }

      if (found.status !== EOrderStatus.NEW) {
        throw new ForbiddenException(`Cannot start order with status '${found.status}'`);
      }

      for (const item of found.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
      }
      found.status = EOrderStatus.STARTED;

      await found.save({ session });
      await session.commitTransaction();

      return found;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async shipOrder(orderId: number): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const found = await this.orderModel.findById(orderId).session(session).exec();
      if (!found) {
        throw new NotFoundException(`Order with id '${orderId}' not found`);
      }

      if (found.status !== EOrderStatus.STARTED) {
        throw new ForbiddenException(`Cannot ship order with status '${found.status}'`);
      }

      found.status = EOrderStatus.SHIPPED;

      await found.save({ session });
      await session.commitTransaction();

      return found;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }
}
