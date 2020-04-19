import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateOrderDto, AdminOrderDto } from '../shared/dtos/admin/order.dto';
import { CounterService } from '../shared/services/counter/counter.service';
import { CustomerService } from '../customer/customer.service';
import { AdminAddOrUpdateCustomerDto } from '../shared/dtos/admin/customer.dto';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatusEnum } from '../shared/enums/order-status.enum';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';
import { Customer } from '../customer/models/customer.model';
import { ProductService } from '../product/product.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { SearchService } from '../shared/services/search/search.service';
import { ElasticOrderModel } from './models/elastic-order.model';
import { OrderFilterDto } from '../shared/dtos/admin/order-filter.dto';
import { ShippingAddressDto } from '../shared/dtos/shared-dtos/shipping-address.dto';
import { ClientSession, FilterQuery } from 'mongoose';
import { ShippingMethodService } from '../shipping-method/shipping-method.service';
import { PaymentMethodService } from '../payment-method/payment-method.service';
import { ClientAddOrderDto } from '../shared/dtos/client/order.dto';
import { TasksService } from '../tasks/tasks.service';
import { __ } from '../shared/helpers/translate/translate.function';

@Injectable()
export class OrderService implements OnApplicationBootstrap {

  private cachedOrderCount: number;

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private readonly counterService: CounterService,
              private readonly shippingMethodService: ShippingMethodService,
              private readonly paymentMethodService: PaymentMethodService,
              private readonly tasksService: TasksService,
              private readonly pdfGeneratorService: PdfGeneratorService,
              private readonly inventoryService: InventoryService,
              private readonly productService: ProductService,
              private readonly searchService: SearchService,
              private readonly customerService: CustomerService) {
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());
  }

  async getOrdersList(spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    let orderDtos: AdminOrderDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      orderDtos = searchResponse[0];
      itemsFiltered = searchResponse[1];

    } else {
      let conditions: FilterQuery<Order> = { };
      if (spf.customerId) {
        conditions.customerId = spf.customerId;
      }

      const orders: Order[] = await this.orderModel
        .find(conditions)
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      orderDtos = plainToClass(AdminOrderDto, orders, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countOrders();
    const pagesTotal = Math.ceil(itemsTotal / spf.limit);
    return {
      data: orderDtos,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  async getOrderById(orderId: number): Promise<DocumentType<Order>> {
    const found = await this.orderModel.findById(orderId).exec();
    if (!found) {
      throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
    }

    return found;
  }

  async updateOrdersByStatus(orderStatus: OrderStatusEnum,
                             updateOrdersFunction: (orders) => Promise<Order[]>): Promise<Order[]> {
    const statusProp: keyof Order = 'status';
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let orders = await this.orderModel.find({[statusProp]: orderStatus}).session(session).exec();

      const updatedOrders = await updateOrdersFunction(orders);

      for (let order of orders) {
        await order.save({ session });
        await this.updateSearchData(order);
      }
      await session.commitTransaction();
      return updatedOrders;
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async createOrderAdmin(orderDto: AdminAddOrUpdateOrderDto, migrate: any): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let customer: Customer;

      if (orderDto.customerId) {
        if (orderDto.shouldSaveAddress) {
          customer = await this.customerService.addCustomerAddressById(orderDto.customerId, orderDto.address, session);
        } else {
          customer = await this.customerService.getCustomerById(orderDto.customerId);
        }

      } else {
        customer = await this.customerService.getCustomerByEmailOrPhoneNumber(orderDto.customerEmail);

        if (!customer) {
          if (!orderDto.customerFirstName) { orderDto.customerFirstName = orderDto.address.firstName; }
          if (!orderDto.customerLastName) { orderDto.customerLastName = orderDto.address.lastName; }
          if (!orderDto.customerPhoneNumber) { orderDto.customerPhoneNumber = orderDto.address.phoneNumber; }

          const customerDto = new AdminAddOrUpdateCustomerDto();
          customerDto.firstName = orderDto.customerFirstName;
          customerDto.lastName = orderDto.customerLastName;
          customerDto.email = orderDto.customerEmail;
          customerDto.phoneNumber = orderDto.customerPhoneNumber;
          customerDto.addresses = [{ ...orderDto.address, isDefault: true }];

          customer = await this.customerService.adminCreateCustomer(customerDto, session, migrate);
        }

        orderDto.customerId = customer.id;
      }

      const newOrder = await this.createOrder(orderDto, customer, session, migrate);
      await session.commitTransaction();

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();
      this.tasksService.sendLeaveReviewEmail(newOrder);
      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async createOrderClient(orderDto: ClientAddOrderDto, customer: DocumentType<Customer>): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      if (!customer) {
        customer = await this.customerService.getCustomerByEmailOrPhoneNumber(orderDto.email);

        if (customer) {
          const hasSameAddress = customer.addresses.find(address => (address.firstName === orderDto.address.firstName
            && address.lastName === orderDto.address.lastName
            && address.phoneNumber === orderDto.address.phoneNumber
            && address.city === orderDto.address.city
            && (address.streetName === orderDto.address.streetName || address.novaposhtaOffice === orderDto.address.novaposhtaOffice)
          ));

          if (!hasSameAddress) {
            await this.customerService.addCustomerAddress(customer, orderDto.address, session);
          }

        } else {
          const customerDto = new AdminAddOrUpdateCustomerDto();
          customerDto.firstName = orderDto.address.firstName;
          customerDto.lastName = orderDto.address.lastName;
          customerDto.email = orderDto.email;
          customerDto.phoneNumber = orderDto.address.phoneNumber;
          customerDto.addresses = [{ ...orderDto.address, isDefault: true }];

          customer = await this.customerService.adminCreateCustomer(customerDto, session, false) as any;
        }
      }

      const newOrder = await this.createOrder(orderDto, customer, session);
      await session.commitTransaction();

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();
      this.tasksService.sendLeaveReviewEmail(newOrder);
      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  private async createOrder(orderDto: AdminAddOrUpdateOrderDto | ClientAddOrderDto, customer: Customer, session: ClientSession, migrate?: any) {
    const newOrder = new this.orderModel(orderDto);

    if (!migrate) {
      newOrder.id = await this.counterService.getCounter(Order.collectionName, session);
      newOrder.idForCustomer = addLeadingZeros(newOrder.id);
      newOrder.customerId = customer.id;
      newOrder.customerEmail = customer.email;
      newOrder.customerFirstName = customer.firstName;
      newOrder.customerLastName = customer.lastName;
      newOrder.customerPhoneNumber = customer.phoneNumber;
      newOrder.createdAt = new Date();
      newOrder.status = OrderStatusEnum.NEW;
      newOrder.discountPercent = customer.discountPercent;
      this.setOrderPrices(newOrder);

      const products = await this.productService.getProductsWithQtyBySkus(orderDto.items.map(item => item.sku));
      for (const item of orderDto.items) {
        const product = products.find(product => product._id === item.productId);
        const variant = product && product.variants.find(variant => variant._id.equals(item.variantId));

        if (!product || !variant) {
          throw new BadRequestException(__('Product with sku "$1" not found', 'ru', item.sku));
        }

        if (variant.qtyInStock < item.qty) {
          throw new ForbiddenException(__('Not enough quantity in stock. You are trying to add: $1. In stock: $2', 'ru', item.qty, variant.qtyInStock));
        }

        await this.inventoryService.addToOrdered(item.sku, item.qty, newOrder.id, session);
      }

      await this.customerService.addOrderToCustomer(customer.id, newOrder, session);

      const shippingMethod = await this.shippingMethodService.getShippingMethodById(orderDto.shippingMethodId);
      newOrder.shippingMethodAdminName = shippingMethod.adminName;
      newOrder.shippingMethodClientName = shippingMethod.clientName;

      const paymentMethod = await this.paymentMethodService.getPaymentMethodById(orderDto.paymentMethodId);
      newOrder.paymentType = paymentMethod.paymentType;
      newOrder.paymentMethodAdminName = paymentMethod.adminName;
      newOrder.paymentMethodClientName = paymentMethod.clientName;
    }

    await newOrder.save({ session });
    return newOrder;
  }

  async editOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const found = await this.orderModel.findById(orderId).session(session).exec();
      if (!found) {
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }

      if (found.status !== OrderStatusEnum.NEW && found.status !== OrderStatusEnum.STARTED) {
        throw new ForbiddenException(__('Cannot edit order with status "$1"', 'ru', found.status));
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

  async editOrderAddress(orderId: number, addressDto: ShippingAddressDto): Promise<Order> {
    const addressProp: keyof Order = 'address';

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
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }

      if (found.status !== OrderStatusEnum.NEW && found.status !== OrderStatusEnum.STARTED) {
        throw new ForbiddenException(__('Cannot cancel order with status "$1"', 'ru', found.status));
      }

      for (const item of found.items) {
        await this.inventoryService.retrieveFromOrderedBackToStock(item.sku, orderId, session);
      }
      found.status = OrderStatusEnum.CANCELED;

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
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }

      if (found.status !== OrderStatusEnum.NEW) {
        throw new ForbiddenException(__('Cannot start order with status "$1"', 'ru', found.status));
      }

      for (const item of found.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
      }
      found.status = OrderStatusEnum.STARTED;

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
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }

      if (found.status !== OrderStatusEnum.STARTED) {
        throw new ForbiddenException(__('Cannot ship order with status "$1"', 'ru', found.status));
      }

      found.status = OrderStatusEnum.SHIPPED;

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

  public updateSearchData(order: Order): Promise<any> {
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
