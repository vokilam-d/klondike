import { ForbiddenException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../shared/dtos/admin/order.dto';
import { CounterService } from '../shared/counter/counter.service';
import { CustomerService } from '../customer/customer.service';
import { AdminAddOrUpdateCustomerDto, AdminShippingAddressDto } from '../shared/dtos/admin/customer.dto';
import { InventoryService } from '../inventory/inventory.service';
import { EOrderStatus } from '../shared/enums/order-status.enum';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';
import { Customer } from '../customer/models/customer.model';
import { ProductService } from '../product/product.service';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { plainToClass } from 'class-transformer';
import { SearchService } from '../shared/search/search.service';
import { ElasticOrderModel } from './models/elastic-order.model';
import { OrderFilterDto } from '../shared/dtos/admin/order-filter.dto';

@Injectable()
export class OrderService implements OnApplicationBootstrap {

  private cachedOrderCount: number;

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private counterService: CounterService,
              private pdfGeneratorService: PdfGeneratorService,
              private inventoryService: InventoryService,
              private productService: ProductService,
              private readonly searchService: SearchService,
              private customerService: CustomerService) {
  }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());
  }

  async getOrdersList(spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    let orders: AdminOrderDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      orders = searchResponse[0];
      itemsFiltered = searchResponse[1];

    } else {
      let conditions: any = {};
      if (spf.customerId) {
        const customerIdProp = getPropertyOf<AdminOrderDto>('customerId');
        conditions[customerIdProp] = spf.customerId;
      }

      orders = await this.orderModel
        .find(conditions)
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      orders = plainToClass(AdminOrderDto, orders, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countOrders();
    const pagesTotal = Math.ceil(itemsTotal / spf.limit);
    return {
      data: orders,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
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
      await this.addSearchData(newOrder);
      await session.commitTransaction();

      this.updateCachedOrderCount();
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
      this.updateSearchData(found);
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

  async countOrders(): Promise<number> {
    if (this.cachedOrderCount >= 0) {
      return this.cachedOrderCount;
    } else {
      return this.orderModel.estimatedDocumentCount().exec().then(count => this.cachedOrderCount = count);
    }
  }

  private updateCachedOrderCount() {
    this.orderModel.estimatedDocumentCount().exec()
      .then(count => this.cachedOrderCount = count)
      .catch(_ => {});
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
      for (const item of found.items) {
        await this.productService.incrementSalesCount(item.productId, item.variantId, item.qty, session);
      }

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

  private async addSearchData(order: Order) {
    const orderDto = plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Order.collectionName, order.id, orderDto);
  }

  private updateSearchData(order: Order): Promise<any> {
    const orderDto = plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Order.collectionName, order.id, orderDto);
  }

  private async searchByFilters(spf: OrderFilterDto) {
    const filters = spf.getNormalizedFilters();
    if (spf.customerId) {
      const customerIdProp = getPropertyOf<AdminOrderDto>('customerId');
      filters.push({ fieldName: customerIdProp, value: `${spf.customerId}` });
    }

    return this.searchService.searchByFilters<AdminOrderDto>(
      Order.collectionName,
      filters,
      spf.skip,
      spf.limit
    );
  }
}
