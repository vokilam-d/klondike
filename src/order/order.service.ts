import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
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
import { FinalOrderStatuses, OrderStatusEnum, ShippedOrderStatuses } from '../shared/enums/order-status.enum';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { addLeadingZeros } from '../shared/helpers/add-leading-zeros.function';
import { Customer } from '../customer/models/customer.model';
import { ProductService } from '../product/services/product.service';
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
import { PaymentTypeEnum } from '../shared/enums/payment-type.enum';
import { OnlinePaymentDetailsDto } from '../shared/dtos/client/online-payment-details.dto';
import { createHmac } from 'crypto';
import { isObject } from 'src/shared/helpers/is-object.function';
import { areAddressesSame } from '../shared/helpers/are-addresses-same.function';
import { EmailService } from '../email/email.service';
import { getCronExpressionEarlyMorning } from '../shared/helpers/get-cron-expression-early-morning.function';
import { isProdEnv } from '../shared/helpers/is-prod-env.function';
import { User } from '../user/models/user.model';
import { OrderItemService } from './order-item.service';
import { OrderItem } from './models/order-item.model';
import { AddressTypeEnum } from '../shared/enums/address-type.enum';
import { CurrencyCodeEnum } from '../shared/enums/currency.enum';

@Injectable()
export class OrderService implements OnApplicationBootstrap {

  private logger = new Logger(OrderService.name);
  private cachedOrderCount: number;

  constructor(
    @InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
    @Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
    private readonly counterService: CounterService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly tasksService: TasksService,
    private readonly emailService: EmailService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly inventoryService: InventoryService,
    private readonly orderItemService: OrderItemService,
    private readonly productService: ProductService,
    private readonly searchService: SearchService,
    private readonly novaPoshtaService: NovaPoshtaService,
    private readonly shipmentSenderService: ShipmentSenderService
  ) { }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());
    // this.reindexAllSearchData();
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
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);
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

  async createOrderAdmin(orderDto: AdminAddOrUpdateOrderDto, user: DocumentType<User>): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let customer: Customer;

      let address = orderDto.shipment.recipient;
      if (orderDto.customerId) {
        if (orderDto.shouldSaveAddress) {
          customer = await this.customerService.addAddressByCustomerId(orderDto.customerId, address, session);
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

          customer = await this.customerService.adminCreateCustomer(customerDto, session);
        }

        orderDto.customerId = customer.id;
      }

      const newOrder = await this.createOrder(orderDto, customer, session);
      newOrder.source = 'manager';
      newOrder.logs.push({ time: new Date(), text: `Created order by manager, userLogin=${user?.login}` });
      newOrder.status = OrderStatusEnum.PROCESSING;
      await this.fetchShipmentStatus(newOrder);

      await newOrder.save({ session });

      await session.commitTransaction();

      this.logger.log(`Created order by manager, orderId=${newOrder.id}, userLogin=${user?.login}`);

      this.addSearchData(newOrder).then();
      this.updateCachedOrderCount();

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
      }

      if (customer) {
        await this.customerService.emptyCart(customer, session);

        const hasSameAddress = customer.addresses.find(address => areAddressesSame(address, orderDto.address));
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

        customer = await this.customerService.adminCreateCustomer(customerDto, session) as any;
      }

      const shipment = new ShipmentDto();
      shipment.recipient = orderDto.address;

      const prices = await this.orderItemService.calcOrderPrices(orderDto.items, customer);

      const newOrder = await this.createOrder({ ...orderDto, shipment, prices }, customer, session);

      OrderService.checkForCheckoutRules(newOrder);

      newOrder.status = OrderStatusEnum.NEW;
      newOrder.source = 'client';
      newOrder.logs.push({ time: new Date(), text: `Created order` });

      await newOrder.save({ session });
      await session.commitTransaction();

      this.logger.log(`Created order by client, orderId=${newOrder.id}, customerId=${customer.id}`);

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();

      this.emailService.sendOrderConfirmationEmail(newOrder, isProdEnv()).then();
      this.tasksService.sendLeaveReviewEmail(newOrder)
        .catch(err => this.logger.error(`Could not create task to send "Leave a review" email: ${err.message}`));

      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  private async createOrder(orderDto: AdminAddOrUpdateOrderDto | ClientAddOrderDto, customer: Customer, session: ClientSession): Promise<DocumentType<Order>> {
    const newOrder = new this.orderModel(orderDto);

    newOrder.id = await this.counterService.getCounter(Order.collectionName, session);
    newOrder.idForCustomer = addLeadingZeros(newOrder.id);
    newOrder.customerId = customer.id;
    newOrder.customerEmail = customer.email;
    newOrder.customerFirstName = customer.firstName;
    newOrder.customerLastName = customer.lastName;
    newOrder.customerPhoneNumber = customer.phoneNumber;
    newOrder.customerNote = customer.note;
    newOrder.createdAt = new Date();
    newOrder.status = OrderStatusEnum.NEW;

    const products = await this.productService.getProductsWithQtyBySkus(orderDto.items.map(item => item.sku));
    for (let i = 0; i < newOrder.items.length; i++) {
      const { productId, variantId, sku, qty, additionalServices } = newOrder.items[i];
      const product = products.find(product => product._id === productId);
      const variant = product?.variants.find(variant => variant._id.equals(variantId));
      if (!product || !variant) {
        throw new BadRequestException(__('Product with sku "$1" not found', 'ru', sku));
      }

      const additionalServiceIds = additionalServices.map(service => service.id);
      newOrder.items[i] = await this.orderItemService.createOrderItem(sku, qty, additionalServiceIds, false, false, product, variant);

      await this.inventoryService.addToOrdered(sku, qty, newOrder.id, session);
      await this.productService.updateSearchDataById(productId, session);
    }

    await this.customerService.addOrderToCustomer(customer.id, newOrder.id, session);

    newOrder.shippingMethodName = __(newOrder.shipment.recipient.addressType, 'ru');

    await this.setPaymentInfoByMethodId(newOrder, orderDto.paymentMethodId);

    return newOrder;
  }

  async editOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto): Promise<Order> {
    return await this.updateOrderById(orderId, async (order, session) => {
      if (ShippedOrderStatuses.includes(order.status)) {
        throw new ForbiddenException(__('Cannot edit order with status "$1"', 'ru', order.status));
      }

      for (const item of order.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
        await this.productService.updateSearchDataById(item.productId, session);
      }
      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, orderId, session);
        await this.productService.updateSearchDataById(item.productId, session);
      }

      const oldTrackingNumber = order.shipment.trackingNumber;
      const newTrackingNumber = orderDto.shipment.trackingNumber;
      const oldPaymentMethodId = order.paymentMethodId;
      const newPaymentMethodId = orderDto.paymentMethodId;
      Object.keys(orderDto).forEach(key => order[key] = orderDto[key]);
      if (oldTrackingNumber !== newTrackingNumber) {
        await this.fetchShipmentStatus(order);
      }
      if (oldPaymentMethodId !== newPaymentMethodId) {
        await this.setPaymentInfoByMethodId(order, newPaymentMethodId);
      }

      order.logs.push({ time: new Date(), text: `Edited order` });

      return order;
    });
  }

  async deleteOrder(orderId: number): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      const order = await this.orderModel.findByIdAndDelete(orderId).exec();
      if (!order) {
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }
      await this.customerService.removeOrderFromCustomer(order.id, session);

      await session.commitTransaction();

      this.logger.log(`Deleted order #${order.id}`);

      await this.deleteSearchData(order.id);
      this.updateCachedOrderCount();

      return order;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
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

  private async shippedOrderPostActions(order: Order, session?: ClientSession): Promise<Order> {
    for (const item of order.items) {
      await this.inventoryService.removeFromOrderedAndStock(item.sku, item.qty, order.id, session);
      await this.productService.incrementSalesCount(item.productId, item.variantId, item.qty, session);
      await this.productService.updateSearchDataById(item.productId, session);
    }

    return order;
  }

  private async finishedOrderPostActions(order: Order, session: ClientSession): Promise<Order> {
    await this.customerService.incrementTotalOrdersCost(order.customerId, order.prices.totalCost, session);

    return order;
  }

  async printOrder(orderId: number) {
    const order = await this.getOrderById(orderId);
    return {
      fileName: `Заказ №${order.idForCustomer}.pdf`,
      pdf: await this.pdfGeneratorService.generateOrderPdf(order.toJSON())
    };
  }

  async printInvoice(orderId: number) {
    const order = await this.getOrderById(orderId);
    return {
      fileName: `Рахунок-фактура №${order.id}.pdf`,
      pdf: await this.pdfGeneratorService.generateInvoicePdf(order.toJSON())
    };
  }

  private async addSearchData(order: Order) {
    const orderDto = plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true });
    await this.searchService.addDocument(Order.collectionName, order.id, orderDto);
  }

  public updateSearchData(order: Order): Promise<any> {
    const orderDto = plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(Order.collectionName, order.id, orderDto);
  }

  public deleteSearchData(orderId: number): Promise<any> {
    return this.searchService.deleteDocument(Order.collectionName, orderId);
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
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticOrderModel()
    );
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  public async findWithNotFinalStatusesAndUpdate(): Promise<Order[]> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      const shipmentProp: keyof Order = 'shipment';
      const numberProp: keyof Shipment = 'trackingNumber';

      const orders = await this.orderModel.find({
        [`${shipmentProp}.${numberProp}`]: {
          $nin: ['', undefined, null]
        },
        status: {
          $nin: FinalOrderStatuses
        }
      }).exec();

      const trackingNumbers: string[] = orders.map(order => order.shipment.trackingNumber);
      const shipments: ShipmentDto[] = await this.novaPoshtaService.fetchShipments(trackingNumbers);

      for (const order of orders) {
        const shipment: ShipmentDto = shipments.find(ship => ship.trackingNumber === order.shipment.trackingNumber);
        if (!shipment) { continue; }

        const oldShipmentStatus = order.shipment.status;
        order.shipment.status = shipment.status;
        order.shipment.statusDescription = shipment.statusDescription;
        const newShipmentStatus = order.shipment.status;

        if (newShipmentStatus !== oldShipmentStatus) {
          order.logs.push({ time: new Date(), text: `Updated shipment status to "${order.shipment.status}" - ${order.shipment.statusDescription}` });
        }

        const oldOrderStatus = order.status;
        OrderService.updateOrderStatusByShipment(order);
        const newOrderStatus = order.status;
        if (newOrderStatus !== oldOrderStatus) {
          switch (newOrderStatus) {
            case OrderStatusEnum.SHIPPED:
              await this.shippedOrderPostActions(order, session);
              break;
            case OrderStatusEnum.FINISHED:
              await this.finishedOrderPostActions(order, session);
              break;
          }

          order.logs.push({ time: new Date(), text: `Updated order status by shipment status to "${order.status}" - ${order.statusDescription}` });
        }

        await order.save({ session });
        await this.updateSearchData(order);
      }

      await session.commitTransaction();
      return orders;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
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
    let estimatedDeliveryDate: string = '';

    if (order.shipment.trackingNumber) {
      const shipmentDto: ShipmentDto = await this.novaPoshtaService.fetchShipment(order.shipment.trackingNumber);
      status = shipmentDto?.status || '';
      statusDescription = shipmentDto?.statusDescription || '';
      estimatedDeliveryDate = shipmentDto?.estimatedDeliveryDate || '';
    }

    order.shipment.status = status;
    order.shipment.statusDescription = statusDescription;
    order.shipment.estimatedDeliveryDate = estimatedDeliveryDate;

    OrderService.updateOrderStatusByShipment(order);
  }

  private static patchShipmentData(shipment: Shipment, shipmentDto: ShipmentDto) {
    const copyValues = (fromObject: any, toObject: any) => {
      for (const key of Object.keys(fromObject)) {
        if (fromObject[key] === undefined) { continue; }

        if (isObject(fromObject[key])) {
          copyValues(fromObject[key], toObject[key]);
        } else {
          toObject[key] = fromObject[key];
        }
      }
    }

    copyValues(shipmentDto, shipment);
  }

  private static updateOrderStatusByShipment(order: Order) {
    const isCashOnDelivery = order.paymentType === PaymentTypeEnum.CASH_ON_DELIVERY;
    const isReceived = order.shipment.status === ShipmentStatusEnum.RECEIVED;
    const isCashPickedUp = order.shipment.status === ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP;
    const isReadyToShip = order.status === OrderStatusEnum.READY_TO_PACK
      || order.status === OrderStatusEnum.PACKED
      || order.status === OrderStatusEnum.READY_TO_SHIP;
    const isJustSent = isReadyToShip && order.shipment.status === ShipmentStatusEnum.HEADING_TO_CITY;

    if (!isCashOnDelivery && isReceived || isCashOnDelivery && isCashPickedUp) {
      order.status = OrderStatusEnum.FINISHED;
      order.isOrderPaid = true;
    } else if (order.shipment.status === ShipmentStatusEnum.RECIPIENT_DENIED) {
      order.status = OrderStatusEnum.RECIPIENT_DENIED;
    } else if (isJustSent) {
      order.status = OrderStatusEnum.SHIPPED;
    }
  }

  async getPaymentDetails(orderId: number): Promise<OnlinePaymentDetailsDto> {
    const order = await this.getOrderById(orderId);

    const merchantAccount = process.env.MERCHANT_ACCOUNT;
    const merchantDomainName = process.env.MERCHANT_DOMAIN;
    const orderReference = order.idForCustomer + '#' + new Date().getTime();
    const orderDate = order.createdAt.getTime() + '';
    const amount = order.prices.totalCost;
    const currency = CurrencyCodeEnum.UAH.toUpperCase();

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

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log(`Start reindex all search data`);
    const orders = await this.orderModel.find().sort({ _id: -1 }).exec();
    await this.searchService.deleteCollection(Order.collectionName);
    await this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());

    for (const ordersBatch of getBatches(orders, 20)) {
      await Promise.all(ordersBatch.map(order => this.addSearchData(order)));
      this.logger.log(`Reindexed ids: ${ordersBatch.map(i => i.id).join()}`);
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

  async changeStatus(orderId: number, status: OrderStatusEnum) {
    return await this.updateOrderById(orderId, async (order, session) => {

      const assertStatus = (statusToAssert: OrderStatusEnum) => {
        if (order.status !== statusToAssert) {
          throw new BadRequestException(__('Cannot change status to "$1": order must be with status "$2"', 'ru', status, statusToAssert));
        }
      }

      switch (status) {
        case OrderStatusEnum.PROCESSING:
          assertStatus(OrderStatusEnum.NEW);
          break;

        case OrderStatusEnum.READY_TO_PACK:
          assertStatus(OrderStatusEnum.PROCESSING);
          break;

        case OrderStatusEnum.PACKED:
          assertStatus(OrderStatusEnum.READY_TO_PACK);
          break;

        case OrderStatusEnum.READY_TO_SHIP:
          assertStatus(OrderStatusEnum.PACKED);
          if (order.paymentType !== PaymentTypeEnum.CASH_ON_DELIVERY && !order.isOrderPaid) {
            throw new BadRequestException(__('Cannot change status to "$1": order is not paid', 'ru', status));
          }
          break;

        case OrderStatusEnum.RETURNING:
        case OrderStatusEnum.REFUSED_TO_RETURN:
          assertStatus(OrderStatusEnum.RECIPIENT_DENIED);
          break;
        case OrderStatusEnum.RETURNED:
          for (const item of order.items) {
            await this.inventoryService.addToStock(item.sku, item.qty, session);
            await this.productService.updateSearchDataById(item.productId, session);
          }
          break;

        case OrderStatusEnum.CANCELED:
          if (ShippedOrderStatuses.includes(status)) {
            throw new BadRequestException(__('Cannot cancel order with status "$1"', 'ru', status));
          }
          for (const item of order.items) {
            await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
            await this.productService.updateSearchDataById(item.productId, session);
          }
          break;

        case OrderStatusEnum.FINISHED:
          if (order.status === OrderStatusEnum.FINISHED) {
            throw new BadRequestException(__('Cannot change status to "$1": order must not be with status "$2"', 'ru', status, OrderStatusEnum.FINISHED));
          }

          if (!ShippedOrderStatuses.includes(order.status)) {
            await this.shippedOrderPostActions(order, session);
          }
          await this.finishedOrderPostActions(order, session);
          break;

        default:
          throw new BadRequestException(__('Cannot change status to "$1": disallowed status', 'ru', status));
          break;
      }

      const oldStatus = order.status;
      order.status = status;

      order.logs.push({ time: new Date(), text: `Changed order status from "${oldStatus}" to "${order.status}"` });

      return order;
    });
  }

  async createInternetDocument(orderId: number, shipmentDto: ShipmentDto): Promise<Order> {
    return this.updateOrderById(orderId, async order => {
      if (shipmentDto.trackingNumber) {
        order.shipment.trackingNumber = shipmentDto.trackingNumber;
        order.status = OrderStatusEnum.PACKED;
        await this.fetchShipmentStatus(order);
      } else {
        OrderService.patchShipmentData(order.shipment, shipmentDto);

        const shipmentSender = await this.shipmentSenderService.getById(shipmentDto.senderId);
        order.shipment.sender.firstName = shipmentSender.firstName;
        order.shipment.sender.lastName = shipmentSender.lastName;
        order.shipment.sender.phone = shipmentSender.phone;
        order.shipment.sender.address = shipmentSender.address;
        order.shipment.sender.settlement = shipmentSender.city;
        order.shipment.sender.addressType = shipmentSender.addressType;

        const { trackingNumber, estimatedDeliveryDate } = await this.novaPoshtaService.createInternetDocument(order.shipment, shipmentSender, order.paymentType);
        order.shipment.trackingNumber = trackingNumber;
        order.shipment.estimatedDeliveryDate = estimatedDeliveryDate;
        order.shipment.status = ShipmentStatusEnum.AWAITING_TO_BE_RECEIVED_FROM_SENDER;
        order.shipment.statusDescription = 'Новая почта ожидает поступление';
      }

      if (order.paymentType === PaymentTypeEnum.CASH_ON_DELIVERY || order.isOrderPaid) {
        order.status = OrderStatusEnum.READY_TO_SHIP;
      }

      return order;
    });
  }

  async changeOrderPaymentStatus(id: number, isPaid: boolean): Promise<Order> {
    return await this.updateOrderById(id, async order => {
      const oldIsPaid = order.isOrderPaid;
      const oldOrderStatus = order.status;
      order.isOrderPaid = isPaid;

      if (order.isOrderPaid) {
        if (order.status === OrderStatusEnum.PACKED) {
          order.status = OrderStatusEnum.READY_TO_SHIP;
        }
      } else {
        if (order.status === OrderStatusEnum.READY_TO_SHIP) {
          order.status = OrderStatusEnum.PACKED;
        }
      }

      if (oldIsPaid !== order.isOrderPaid) {
        order.logs.push({ time: new Date(), text: `Changed "isOrderPaid" from "${oldIsPaid}" to "${order.isOrderPaid}"` });
      }
      if (oldOrderStatus !== order.status) {
        order.logs.push({ time: new Date(), text: `Changed order status from "${oldOrderStatus}" to "${order.status}"` });
      }

      return order;
    });
  }

  async updateOrderAdminNote(id: number, adminNote: string): Promise<Order> {
    return await this.updateOrderById(id, async order => {
      order.adminNote = adminNote;
      return order;
    });
  }

  async changeCustomerEmail(oldEmail: string, newEmail: string, session: ClientSession): Promise<void> {
    await this.orderModel.updateMany(
      { customerEmail: oldEmail },
      { customerEmail: newEmail }
    ).session(session).exec();
  }

  private async setPaymentInfoByMethodId(order: Order, paymentMethodId: string) {
    const paymentMethod = await this.paymentMethodService.getPaymentMethodById(paymentMethodId);
    order.paymentType = paymentMethod.paymentType;
    order.paymentMethodAdminName = paymentMethod.adminName;
    order.paymentMethodClientName = paymentMethod.clientName;

    return;
  }

  async findShippedOrdersByDate([dateFromStr, dateToStr]: string[]): Promise<Pick<Order, 'items'>[]> {

    let dateFrom: Date;
    let dateTo: Date;
    if (dateFromStr) {
      dateFrom = new Date(dateFromStr);
    }
    if (dateToStr) {
      dateTo = new Date(dateToStr);
      dateTo.setHours(dateTo.getHours() + 24);
      dateTo.setSeconds(dateTo.getSeconds() - 1);
    }

    const filterQuery: FilterQuery<Order> = {
      status: { $in: ShippedOrderStatuses },
      createdAt: {
        ...(dateFrom ? { $gte: dateFrom  } : { }),
        ...(dateTo ? { $lte: dateTo } : { })
      }
    };

    const itemsProp: keyof Order = 'items';
    const productIdProp: keyof OrderItem = 'productId';
    const qtyProp: keyof OrderItem = 'qty';
    const projection = {
      [`${itemsProp}.${productIdProp}`]: 1,
      [`${itemsProp}.${qtyProp}`]: 1,
    }

    return this.orderModel.find(filterQuery, projection).exec();
  }

  private static checkForCheckoutRules(order: Order) {
    const errors: string[] = [];
    const isCashOnDeliveryMethod = order.paymentType === PaymentTypeEnum.CASH_ON_DELIVERY;
    if (!isCashOnDeliveryMethod) { return; }

    if (order.shipment.recipient.addressType === AddressTypeEnum.DOORS) {
      errors.push(__('Cash on delivery is not available with address delivery', 'ru'));
    }

    const disallowedItem = order.items.find(item => item.name.toLowerCase().match(/сусаль([ ,])/g));
    if (disallowedItem) {
      errors.push(__('Cash on delivery is not available for gold leaf', 'ru'));
    }

    if (errors.length) {
      throw new BadRequestException(errors);
    }
  }
}
