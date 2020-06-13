import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
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
import { ClientSession, FilterQuery } from 'mongoose';
import { PaymentMethodService } from '../payment-method/payment-method.service';
import { ClientAddOrderDto } from '../shared/dtos/client/order.dto';
import { TasksService } from '../tasks/tasks.service';
import { __ } from '../shared/helpers/translate/translate.function';
import { NovaPoshtaService } from '../nova-poshta/nova-poshta.service';
import { ShipmentSenderService } from '../nova-poshta/shipment-sender.service';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { ShipmentStatusEnum } from '../shared/enums/shipment-status.enum';
import { Shipment } from './models/shipment.model';
import { PaymentMethodEnum } from '../shared/enums/payment-method.enum';
import { OnlinePaymentDetailsDto } from '../shared/dtos/client/online-payment-details.dto';
import { createHmac } from 'crypto';
import { isObject } from 'src/shared/helpers/is-object.function';

@Injectable()
export class OrderService implements OnApplicationBootstrap {

  private logger = new Logger(OrderService.name);
  private cachedOrderCount: number;

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private readonly counterService: CounterService,
              private readonly paymentMethodService: PaymentMethodService,
              private readonly tasksService: TasksService,
              private readonly pdfGeneratorService: PdfGeneratorService,
              private readonly inventoryService: InventoryService,
              private readonly productService: ProductService,
              private readonly searchService: SearchService,
              private readonly customerService: CustomerService,
              private readonly novaPoshtaService: NovaPoshtaService,
              private readonly shipmentSenderService: ShipmentSenderService) {
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

  async getOrderById(orderId: number, session: ClientSession = null): Promise<DocumentType<Order>> {
    const found = await this.orderModel.findById(orderId).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
    }
    return found;
  }

  async updateOrdersByStatuses(orderStatuses: OrderStatusEnum[],
                               updateOrdersFunction: (orders: DocumentType<Order>[]) => Promise<DocumentType<Order>[]>): Promise<Order[]> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let orders = await this.orderModel.find({ status: { $in: orderStatuses } }).session(session).exec();

      const updatedOrders = await updateOrdersFunction(orders);

      for (let order of updatedOrders) {
        await order.save({ session });
        this.updateSearchData(order).catch();
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

  async updateOrderById(
    orderId: number,
    updateOrderFunction: (order: DocumentType<Order>, session?: ClientSession) => Promise<DocumentType<Order>>
  ): Promise<DocumentType<Order>> {

    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const order = await this.getOrderById(orderId, session);
      const updatedOrder = await updateOrderFunction(order, session);

      await updatedOrder.save({ session });
      await this.updateSearchData(updatedOrder);
      await session.commitTransaction();

      return updatedOrder;
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

      let address = orderDto.shipment.recipient;
      if (orderDto.customerId) {
        if (orderDto.shouldSaveAddress) {
          customer = await this.customerService.addCustomerAddressById(orderDto.customerId, address, session);
        } else {
          customer = await this.customerService.getCustomerById(orderDto.customerId);
        }

      } else {
        customer = await this.customerService.getCustomerByEmailOrPhoneNumber(orderDto.customerEmail);

        if (!customer) {
          if (!orderDto.customerFirstName) { orderDto.customerFirstName = address.firstName; }
          if (!orderDto.customerLastName) { orderDto.customerLastName = address.lastName; }
          if (!orderDto.customerPhoneNumber) { orderDto.customerPhoneNumber = address.phone; }

          const customerDto = new AdminAddOrUpdateCustomerDto();
          customerDto.firstName = orderDto.customerFirstName;
          customerDto.lastName = orderDto.customerLastName;
          customerDto.email = orderDto.customerEmail;
          customerDto.phoneNumber = orderDto.customerPhoneNumber;
          customerDto.addresses = [{ ...address, isDefault: true }];

          customer = await this.customerService.adminCreateCustomer(customerDto, session, migrate);
        }

        orderDto.customerId = customer.id;
      }

      const newOrder = await this.createOrder(orderDto, customer, session, migrate);

      await this.fetchShipmentStatus(newOrder);

      await session.commitTransaction();

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();
      if (!migrate) {
        this.tasksService.sendLeaveReviewEmail(newOrder);
      }
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
          const hasSameAddress = customer.addresses.find(address => (
            address.addressType === orderDto.address.addressType
            && address.firstName === orderDto.address.firstName
            && address.middleName === orderDto.address.middleName
            && address.lastName === orderDto.address.lastName
            && address.phone === orderDto.address.phone
            && address.settlementId === orderDto.address.settlementId
            && address.addressId === orderDto.address.addressId
            && address.flat === orderDto.address.flat
            && address.buildingNumber === orderDto.address.buildingNumber
          ));

          if (!hasSameAddress) {
            await this.customerService.addCustomerAddress(customer, orderDto.address, session);
          }

        } else {
          const customerDto = new AdminAddOrUpdateCustomerDto();
          customerDto.firstName = orderDto.address.firstName;
          customerDto.lastName = orderDto.address.lastName;
          customerDto.email = orderDto.email;
          customerDto.phoneNumber = orderDto.address.phone;
          customerDto.addresses = [{ ...orderDto.address, isDefault: true }];

          customer = await this.customerService.adminCreateCustomer(customerDto, session, false) as any;
        }
      }

      const shipment = new ShipmentDto();
      shipment.recipient = orderDto.address;

      const newOrder = await this.createOrder({ ...orderDto, shipment }, customer, session);
      await session.commitTransaction();

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();

      this.tasksService.sendLeaveReviewEmail(newOrder)
        .catch(err => this.logger.error(`Could not send "Leave a review" email: `, err));

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

      await this.customerService.addOrderToCustomer(customer.id, newOrder.id, session);

      newOrder.shippingMethodName = __(newOrder.shipment.recipient.addressType, 'ru');

      const paymentMethod = await this.paymentMethodService.getPaymentMethodById(orderDto.paymentMethodId);
      newOrder.paymentType = paymentMethod.paymentType;
      newOrder.paymentMethodAdminName = paymentMethod.adminName;
      newOrder.paymentMethodClientName = paymentMethod.clientName;
    }

    await newOrder.save({ session });
    return newOrder;
  }

  async editOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    return await this.updateOrderById(orderId, async (order, session) => {
      if (order.status !== OrderStatusEnum.NEW && order.status !== OrderStatusEnum.STARTED) {
        throw new ForbiddenException(__('Cannot edit order with status "$1"', 'ru', order.status));
      }
      for (const item of order.items) {
        await this.inventoryService.retrieveFromOrderedBackToStock(item.sku, orderId, session);
      }
      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, orderId, session);
      }
      const oldTrackingNumber = order.shipment.trackingNumber;
      const newTrackingNumber = orderDto.shipment.trackingNumber;
      Object.keys(orderDto).forEach(key => order[key] = orderDto[key]);
      if (oldTrackingNumber !== newTrackingNumber) {
        await this.fetchShipmentStatus(order);
      }
      this.setOrderPrices(order);
      return order;
    });
  }

  async countOrders(): Promise<number> {
    if (this.cachedOrderCount >= 0) {
      return this.cachedOrderCount;
    } else {
      return this.orderModel.estimatedDocumentCount().exec().then(count => this.cachedOrderCount = count);
    }
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_30_MINUTES)
  private updateCachedOrderCount() {
    this.orderModel.estimatedDocumentCount().exec()
      .then(count => this.cachedOrderCount = count)
      .catch(_ => {});
  }

  async cancelOrder(orderId: number): Promise<Order> {
    return await this.updateOrderById(orderId, async (order, session) => {
      if (order.status !== OrderStatusEnum.NEW && order.status !== OrderStatusEnum.STARTED) {
        throw new ForbiddenException(__('Cannot cancel order with status "$1"', 'ru', order.status));
      }
      for (const item of order.items) {
        await this.inventoryService.retrieveFromOrderedBackToStock(item.sku, orderId, session);
      }
      order.status = OrderStatusEnum.CANCELED;
      return order;
    });
  }

  async startOrder(orderId: number): Promise<Order> {
    return await this.updateOrderById(orderId, async (order, session) => {
      if (order.status !== OrderStatusEnum.NEW) {
        throw new ForbiddenException(__('Cannot start order with status "$1"', 'ru', order.status));
      }
      for (const item of order.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
      }
      order.status = OrderStatusEnum.STARTED;
      return order;
    });
  }

  async shipOrder(orderId: number, shipmentDto: ShipmentDto): Promise<Order> {
    return await this.updateOrderById(orderId, async (order, session) => {
      OrderService.patchShipmentData(order.shipment, shipmentDto);
      shipmentDto = plainToClass(ShipmentDto, order.shipment, { excludeExtraneousValues: true });

      const shipmentSender = await this.shipmentSenderService.getById(shipmentDto.senderId);
      order.shipment.sender.firstName = shipmentSender.firstName;
      order.shipment.sender.lastName = shipmentSender.lastName;
      order.shipment.sender.phone = shipmentSender.phone;
      order.shipment.sender.address = shipmentSender.address;
      order.shipment.sender.settlement = shipmentSender.city;
      order.shipment.sender.addressType = shipmentSender.addressType;

      shipmentDto = await this.novaPoshtaService.createInternetDocument(shipmentDto, shipmentSender,
        '' + order.totalItemsCost, order.paymentType);
      order.shipment.trackingNumber = shipmentDto.trackingNumber;
      order.shipment.estimatedDeliveryDate = shipmentDto.estimatedDeliveryDate;
      order.shipment.status = ShipmentStatusEnum.AWAITING_TO_BE_RECEIVED_FROM_SENDER;
      order.shipment.statusDescription = 'Готово к отправке';
      OrderService.updateOrderStatusByShipment(order);

      await this.customerService.incrementTotalOrdersCost(order.customerId, order.totalItemsCost, session);
      for (const item of order.items) {
        await this.productService.incrementSalesCount(item.productId, item.variantId, item.qty, session);
      }

      return order;
    });
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

  async updateCounter() { // todo remove this after migrate
    const lastOrder = await this.orderModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Order.collectionName, lastOrder.id);
  }

  async clearCollection() { // todo remove this after migrate
    await this.orderModel.deleteMany({}).exec();
    await this.searchService.deleteCollection(Order.collectionName);
    await this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());
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
      filters.push({ fieldName: customerIdProp, values: [spf.customerId] });
    }

    return this.searchService.searchByFilters<AdminOrderDto>(
      Order.collectionName,
      filters,
      spf.skip,
      spf.limit
    );
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  public async getOrdersWithLatestShipmentStatuses(): Promise<Order[]> {
    return await this.updateOrdersByStatuses([OrderStatusEnum.SHIPPED], async orders => {
      const ordersWithShipments = orders.filter(order => order.shipment?.trackingNumber);

      const trackingNumbers: string[] = ordersWithShipments.map(order => order.shipment.trackingNumber);

      const shipments: ShipmentDto[] = await this.novaPoshtaService.fetchShipments(trackingNumbers);

      ordersWithShipments.forEach(order => {
        const shipment: ShipmentDto = shipments.find(ship => ship.trackingNumber === order.shipment.trackingNumber);
        if (shipment) {
          order.shipment.status = shipment.status;
          order.shipment.statusDescription = shipment.statusDescription;
          OrderService.updateOrderStatusByShipment(order);
        }
      });

      return ordersWithShipments;
    });
  }

  public async updateOrderShipment(orderId: number, shipmentDto: ShipmentDto): Promise<Order> {
    return await this.updateOrderById(orderId, async order => {
      const oldTrackingNumber = order.shipment.trackingNumber;
      const newTrackingNumber = shipmentDto.trackingNumber;
      OrderService.patchShipmentData(order.shipment, shipmentDto);
      if (oldTrackingNumber !== newTrackingNumber) {
        await this.fetchShipmentStatus(order);
      }
      return order;
    });
  }

  private async fetchShipmentStatus(order) {
    let status: string = '';
    let statusDescription: string = '';

    if (order.shipment.trackingNumber) {
      const shipmentDto: ShipmentDto = await this.novaPoshtaService.fetchShipment(order.shipment.trackingNumber);
      status = shipmentDto?.status || '';
      statusDescription = shipmentDto?.statusDescription || '';
    }

    order.shipment.status = status;
    order.shipment.statusDescription = statusDescription;

    OrderService.updateOrderStatusByShipment(order);
  }

  private static patchShipmentData(shipment: Shipment, shipmentDto: ShipmentDto) {
    const copyValues = (fromObject: any, toObject: any) => {
      for (const key of Object.keys(fromObject)) {
        if (fromObject[key] === undefined) { continue;}

        if (isObject(fromObject[key])) {
          copyValues(fromObject[key], toObject[key]);
        } else {
          toObject[key] = fromObject[key];
        }
      }
    }

    copyValues(shipmentDto, shipment);
  }

  private static updateOrderStatusByShipment(order) {
    const isCashOnDelivery = order.paymentType === PaymentMethodEnum.CASH_ON_DELIVERY;
    const isReceived = order.shipment.status === ShipmentStatusEnum.RECEIVED;
    const isCashPickedUp = order.shipment.status === ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP;

    if (isCashOnDelivery && isReceived || !isCashOnDelivery && isCashPickedUp) {
      order.status = OrderStatusEnum.FINISHED;
    }
  }

  async getPaymentDetails(orderId: number): Promise<OnlinePaymentDetailsDto> {
    const order = await this.getOrderById(orderId);

    const merchantAccount = process.env.MERCHANT_ACCOUNT;
    const merchantDomainName = process.env.MERCHANT_DOMAIN;
    const orderReference = order.idForCustomer + '#' + new Date().getTime();
    const orderDate = order.createdAt.getTime() + '';
    const amount = order.totalCost;
    const currency = 'UAH';

    const itemNames: string[] = [];
    const itemPrices: number[] = [];
    const itemCounts: number[] = [];
    for (const item of order.items) {
      itemNames.push(item.name);
      itemPrices.push(item.price);
      itemCounts.push(item.qty);
    }

    const secretKey = process.env.MERCHANT_SECRET_KEY;
    const merchantSignature = createHmac('md5', secretKey)
      .update([ merchantAccount, merchantDomainName, orderReference, orderDate, amount, currency, ...itemNames, ...itemCounts, ...itemPrices ].join(';'))
      .digest('hex');

    return {
      merchantAccount,
      merchantAuthType: 'SimpleSignature',
      merchantDomainName,
      merchantSignature,
      orderReference,
      orderDate,
      orderNo: order.idForCustomer,
      amount,
      currency,
      productName: itemNames,
      productPrice: itemPrices,
      productCount: itemCounts,
      clientFirstName: order.customerFirstName,
      clientLastName: order.customerLastName,
      clientEmail: order.customerEmail,
      clientPhone: order.customerPhoneNumber || order.shipment.recipient.phone,
      language: 'RU'
    }
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_DAY_AT_5AM)
  private async reindexAllSearchData() {
    this.logger.log(`Start reindex all search data`);
    const orders = await this.orderModel.find().exec();

    for (const ordersBatch of getBatches(orders, 20)) {
      await Promise.all(ordersBatch.map(order => this.updateSearchData(order)));
      this.logger.log('Reindexed ids: ', ordersBatch.map(i => i.id).join());
    }

    function getBatches<T = any>(arr: T[], size: number = 2): T[][] {
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i % size !== 0) {
          continue;
        }

        const resultItem = [];
        for (let k = 0; (resultItem.length < size && arr[i + k]); k++) {
          resultItem.push(arr[i + k]);
        }
        result.push(resultItem);
      }

      return result;
    }
  }

  async updateShipmentStatus(orderId: number): Promise<Order> {
    return this.updateOrderById(orderId, async order => {
      await this.fetchShipmentStatus(order);
      return order;
    });
  }
}
