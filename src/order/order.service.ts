import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { AdminSortingPaginatingDto } from '../shared/dtos/admin/filter.dto';
import { AdminAddOrUpdateOrderDto } from '../shared/dtos/admin/order.dto';
import { CounterService } from '../shared/counter/counter.service';

@Injectable()
export class OrderService {

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private counterService: CounterService) {
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
    const newOrder = new this.orderModel(orderDto);
    newOrder.id = await this.counterService.getCounter(Order.collectionName);

    await newOrder.save();

    return newOrder;
  }

  async updateOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    const found = await this.orderModel.findById(orderId).exec();
    if (!found) {
      throw new NotFoundException(`Order with id '${orderId}' not found`);
    }

    Object.keys(orderDto).forEach(key => found[key] = orderDto[key]);
    await found.save();

    return found;
  }

  async deleteOrder(orderId: number): Promise<Order> {
    const deleted = await this.orderModel.findByIdAndDelete(orderId).exec();
    if (!deleted) {
      throw new NotFoundException(`Order with id '${orderId}' not found`);
    }

    return deleted;
  }

  countOrders(): Promise<number> {
    return this.orderModel.estimatedDocumentCount().exec();
  }
}
