import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminSortingPaginatingFilterDto } from '../shared/dtos/admin/filter.dto';
import { AdminAddOrUpdateOrderDto } from '../shared/dtos/admin/order.dto';
import { CounterService } from '../shared/counter/counter.service';
import { CustomerService } from '../customer/customer.service';
import { AdminAddOrUpdateCustomerDto, AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { InventoryService } from '../inventory/inventory.service';
import { EOrderStatus } from '../shared/enums/order-status.enum';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';
import { Customer } from '../customer/models/customer.model';

@Injectable()
export class OrderService {

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private counterService: CounterService,
              private pdfGeneratorService: PdfGeneratorService,
              private inventoryService: InventoryService,
              private customerService: CustomerService) {
  }

  async getAllOrders(sortingPaging: AdminSortingPaginatingFilterDto = new AdminSortingPaginatingFilterDto()): Promise<Order[]> {
    const found = await this.orderModel
      .find()
      .sort(sortingPaging.sort)
      .skip(sortingPaging.skip)
      .limit(sortingPaging.limit)
      .exec();

    return found;
  }

  async getOrderById(orderId: number): Promise<DocumentType<Order>> {
    const found = await this.orderModel.findById(orderId).exec();
    if (!found) {
      throw new NotFoundException(`Order with id '${orderId}' not found`);
    }

    return found;
  }

  async createOrder(orderDto: AdminAddOrUpdateOrderDto, migrate: any): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let customer: Customer;

      if (orderDto.customerId) {
        if (orderDto.shouldSaveAddress) {
          customer = await this.customerService.addCustomerAddress(orderDto.customerId, orderDto.address, session);
        } else {
          customer = await this.customerService.getCustomerById(orderDto.customerId);
        }

      } else {
        if (!orderDto.customerFirstName) { orderDto.customerFirstName = orderDto.address.firstName; }
        if (!orderDto.customerLastName) { orderDto.customerLastName = orderDto.address.lastName; }
        if (!orderDto.customerPhoneNumber) { orderDto.customerPhoneNumber = orderDto.address.phoneNumber; }

        const customerDto = new AdminAddOrUpdateCustomerDto();
        customerDto.firstName = orderDto.customerFirstName;
        customerDto.lastName = orderDto.customerLastName;
        customerDto.email = orderDto.customerEmail;
        customerDto.phoneNumber = orderDto.customerPhoneNumber;
        customerDto.addresses = [{ ...orderDto.address, isDefault: true }];

        customer = await this.customerService.createCustomer(customerDto, session, migrate);

        orderDto.customerId = customer.id;
      }

      const newOrder = new this.orderModel(orderDto);

      if (!migrate) {
        newOrder.id = await this.counterService.getCounter(Order.collectionName, session);
        newOrder.idForCustomer = addLeadingZeros(newOrder.id);
        newOrder.createdAt = new Date();
        newOrder.status = EOrderStatus.NEW;
        newOrder.discountPercent = customer.discountPercent;
        this.setOrderPrices(newOrder);

        for (const item of orderDto.items) {
          await this.inventoryService.addToOrdered(item.sku, item.qty, newOrder.id, session);
        }
        await this.customerService.addOrderToCustomer(customer.id, newOrder, session);
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
      this.setOrderPrices(found);
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

      await this.customerService.incrementTotalOrdersCost(found.customerId, found, session);

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

  async printOrder(orderId: number) {
    const order = await this.getOrderById(orderId);
    return {
      fileName: `Заказ №${order.idForCustomer}.pdf`,
      pdf: await this.pdfGeneratorService.generateOrderPdf(order.toJSON())
    };
  }

  private setOrderPrices(order: Order) {
    if (!order.totalItemsCost) { order.totalItemsCost = 0; }
    if (!order.totalCost) { order.totalCost = 0; }
    if (!order.discountValue) { order.discountValue = 0; }

    for (let item of order.items) {
      order.totalItemsCost += item.cost;
      order.totalCost += item.totalCost;
      order.discountValue += item.discountValue;
    }
  }

  async updateCounter() {
    const lastOrder = await this.orderModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Order.collectionName, lastOrder.id);
  }
}
