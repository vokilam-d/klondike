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
import { __, getTranslations } from '../shared/helpers/translate/translate.function';
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
import { Language } from '../shared/enums/language.enum';
import { AdminOrderItemDto } from '../shared/dtos/admin/order-item.dto';
import { ClientOrderItemDto } from '../shared/dtos/client/order-item.dto';
import { adminDefaultLanguage, clientDefaultLanguage } from '../shared/constants';
import { UserService } from 'src/user/user.service';

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
    private readonly userService: UserService,
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
      const conditions: FilterQuery<Order> = { };
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

  async getOrdersForChart({ from, to }: { from?: Date, to?: Date } = {}): Promise<Partial<Order>[]> {
    if (!from) {
      from = new Date();
      from.setDate(from.getDate() - 100);
      from.setHours(0, 0, 0);
    }

    const conditions: FilterQuery<Order> = { };
    conditions.createdAt = {
      $gte: from
    };
    if (to) {
      conditions.createdAt.$lte = to;
    }

    const projection: Partial<Record<keyof Order, number>> = {
      createdAt: 1,
      source: 1
    };

    return await this.orderModel.find(conditions, projection).exec();
  }

  async getOrderById(orderId: number, lang: Language, session: ClientSession = null): Promise<DocumentType<Order>> {
    const found = await this.orderModel.findById(orderId).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Order with id "$1" not found', lang, orderId));
    }
    return found;
  }

  async updateOrderById(
    orderId: number,
    lang: Language,
    updateOrderFunction: (order: DocumentType<Order>, session?: ClientSession) => Promise<DocumentType<Order>>
  ): Promise<DocumentType<Order>> {

    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const order = await this.getOrderById(orderId, lang, session);
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

  async createOrderAdmin(orderDto: AdminAddOrUpdateOrderDto, lang: Language, user: DocumentType<User>): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let customer: Customer;

      let address = orderDto.shipment.recipient;
      if (orderDto.customerId) {
        if (orderDto.shouldSaveAddress) {
          customer = await this.customerService.addAddressByCustomerId(orderDto.customerId, address, lang, session);
        } else {
          customer = await this.customerService.getCustomerById(orderDto.customerId, lang);
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

          customer = await this.customerService.adminCreateCustomer(customerDto, lang, session);
        }

        orderDto.customerId = customer.id;
      }

      const newOrder = await this.createOrder(orderDto, lang, customer, session, 'manager', user);
      newOrder.logs.push({ time: new Date(), text: `Created order, source=${newOrder.source}, userLogin=${user.login}` });
      newOrder.status = OrderStatusEnum.PROCESSING;
      await this.fetchShipmentStatus(newOrder);

      await newOrder.save({ session });

      await session.commitTransaction();

      this.logger.log(`Created order by manager, orderId=${newOrder.id}, userLogin=${user?.login}`);

      this.addSearchData(newOrder).then();
      this.updateCachedOrderCount();
      this.emailService.sendOrderConfirmationEmail(newOrder, lang, isProdEnv(), false).then();

      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async createOrderClient(orderDto: ClientAddOrderDto, lang: Language, customer: DocumentType<Customer>): Promise<Order> {
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

        customer = await this.customerService.adminCreateCustomer(customerDto, lang, session) as any;
      }

      const shipment = new ShipmentDto();
      shipment.recipient = orderDto.address;

      const prices = await this.orderItemService.calcOrderPrices(orderDto.items, customer, lang);

      const newOrder = await this.createOrder({ ...orderDto, shipment, prices }, lang, customer, session, 'client');

      OrderService.checkForCheckoutRules(newOrder, lang);

      newOrder.status = OrderStatusEnum.NEW;
      newOrder.logs.push({ time: new Date(), text: `Created order, source=${newOrder.source}` });

      await newOrder.save({ session });
      await session.commitTransaction();

      this.logger.log(`Created order, source=${newOrder.source}, orderId=${newOrder.id}, customerId=${customer.id}`);

      await this.addSearchData(newOrder);
      this.updateCachedOrderCount();

      this.emailService.sendOrderConfirmationEmail(newOrder, lang, isProdEnv()).then();
      this.tasksService.sendLeaveReviewEmail(newOrder, lang)
        .catch(err => this.logger.error(`Could not create task to send "Leave a review" email: ${err.message}`));

      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  private async createOrder(
    orderDto: AdminAddOrUpdateOrderDto | ClientAddOrderDto,
    lang: Language,
    customer: Customer,
    session: ClientSession,
    source: 'client' | 'manager',
    user?: User
  ): Promise<DocumentType<Order>> {

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

    const skus: string[] = (orderDto.items as (AdminOrderItemDto | ClientOrderItemDto)[]).map(item => item.sku);
    const products = await this.productService.getProductsWithQtyBySkus(skus);
    for (let i = 0; i < newOrder.items.length; i++) {
      const { productId, variantId, sku, qty, additionalServices } = newOrder.items[i];
      const product = products.find(product => product._id === productId);
      const variant = product?.variants.find(variant => variant._id.equals(variantId));
      if (!product || !variant) {
        throw new BadRequestException(__('Product with sku "$1" not found', lang, sku));
      }

      const additionalServiceIds = additionalServices.map(service => service.id);
      newOrder.items[i] = await this.orderItemService.createOrderItem({ sku, qty, additionalServiceIds, omitReserved: false }, lang, false, product, variant);

      await this.inventoryService.addToOrdered(sku, qty, newOrder.id, session);
      await this.productService.updateSearchDataById(productId, lang, session);
    }

    await this.customerService.addOrderToCustomer(customer.id, newOrder.id, session);

    newOrder.shippingMethodName = getTranslations(newOrder.shipment.recipient.addressType);

    await this.setPaymentInfoByMethodId(newOrder, orderDto.paymentMethodId);
    newOrder.source = source;
    await this.assignOrderManager(newOrder, (orderDto as AdminAddOrUpdateOrderDto).manager?.userId, user);

    return newOrder;
  }

  async editOrder(orderId: number, orderDto: AdminAddOrUpdateOrderDto, user: DocumentType<User>, lang: Language): Promise<Order> {
    return await this.updateOrderById(orderId, lang, async (order, session) => {
      if (ShippedOrderStatuses.includes(order.status)) {
        throw new ForbiddenException(__('Cannot edit order with status "$1"', lang, order.status));
      }

      for (const item of order.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
        await this.productService.updateSearchDataById(item.productId, lang, session);
      }
      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, orderId, session);
        await this.productService.updateSearchDataById(item.productId, lang, session);
      }

      const oldTrackingNumber = order.shipment.trackingNumber;
      const newTrackingNumber = orderDto.shipment.trackingNumber;
      const oldPaymentMethodId = order.paymentMethodId;
      const newPaymentMethodId = orderDto.paymentMethodId;
      Object.keys(orderDto).forEach(key => order[key] = orderDto[key]);
      await this.assignOrderManager(order, orderDto.manager?.userId);
      if (oldTrackingNumber !== newTrackingNumber) {
        await this.fetchShipmentStatus(order);
      }
      if (oldPaymentMethodId !== newPaymentMethodId) {
        await this.setPaymentInfoByMethodId(order, newPaymentMethodId);
      }

      order.logs.push({ time: new Date(), text: `Edited order, userLogin=${user.login}` });

      return order;
    });
  }

  private async assignOrderManager(order: Order, userId: string, user?: User) {
    let assignedManagerUser: User;
    if (userId) {
      assignedManagerUser = await this.userService.getUserById(userId);
    } else if (user) {
      assignedManagerUser = user;
    } else if (OrderService.shouldAssignToKristina(order)) {
      assignedManagerUser = await this.userService.getUserById('5fff628d7db0790020149858'); // Кристина
    } else {
      assignedManagerUser = await this.userService.getUserById('5ef9c63aae2fd882393081c3'); // default Елена
    }

    const newOrderManagerUserId = assignedManagerUser.id.toString();
    const oldOrderManagerUserId = order.manager?.userId;

    order.manager = { name: assignedManagerUser.name, userId: newOrderManagerUserId };

    if (newOrderManagerUserId !== oldOrderManagerUserId || user?.id.toString() !== newOrderManagerUserId) {
      const userLogin = user ? user.login : `<client>`;
      const assignedManagerMessage = `Assigned to manager ${assignedManagerUser.name}, orderId=${order.id}, userLogin=${userLogin}`;

      order.logs.push({ time: new Date(), text: assignedManagerMessage });
      this.logger.log(assignedManagerMessage);

      this.emailService.sendAssignedOrderManagerEmail(order, assignedManagerUser).then();
    }
  }

  async deleteOrder(orderId: number, user: DocumentType<User>, lang: Language): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      const order = await this.orderModel.findByIdAndDelete(orderId).session(session).exec();
      if (!order) {
        throw new NotFoundException(__('Order with id "$1" not found', lang, orderId));
      }

      await this.cancelOrderPreActions(order, lang, session);
      await this.customerService.removeOrderFromCustomer(order.id, session);

      await session.commitTransaction();

      this.logger.log(`Deleted order #${order.id}, userLogin=${user.login}`);

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

  private async cancelOrderPreActions(order: Order, lang: Language, session: ClientSession): Promise<void> {
    for (const item of order.items) {
      await this.inventoryService.removeFromOrdered(item.sku, order.id, session);
      await this.productService.updateSearchDataById(item.productId, lang, session);
    }
  }

  private async shippedOrderPostActions(order: Order, lang: Language, session: ClientSession): Promise<Order> {
    for (const item of order.items) {
      await this.inventoryService.removeFromOrderedAndStock(item.sku, item.qty, order.id, session);
      await this.productService.incrementSalesCount(item.productId, item.variantId, item.qty, session);
      await this.productService.updateSearchDataById(item.productId, lang, session);
    }

    order.shippedAt = new Date();
    order.logs.push({ time: order.shippedAt, text: `Order has been shipped` });

    return order;
  }

  private async finishedOrderPostActions(order: Order, session: ClientSession): Promise<Order> {
    await this.customerService.incrementTotalOrdersCost(order.customerId, order.prices.totalCost, session);

    return order;
  }

  async printOrder(orderId: number, lang: Language) {
    const order = await this.getOrderById(orderId, lang);
    return {
      fileName: `Заказ №${order.idForCustomer}.pdf`,
      pdf: await this.pdfGeneratorService.generateOrderPdf(order.toJSON(), lang)
    };
  }

  async printInvoice(orderId: number, lang: Language) {
    const order = await this.getOrderById(orderId, lang);
    return {
      fileName: `Рахунок-фактура №${order.id}.pdf`,
      pdf: await this.pdfGeneratorService.generateInvoicePdf(order.toJSON())
    };
  }

  async printDeliveryNote(orderId: number) {
    const order = await this.getOrderById(orderId);
    return {
      fileName: `Видаткова накладна №${order.id}.pdf`,
      pdf: await this.pdfGeneratorService.generateDeliveryNotePdf(order.toJSON())
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
  public async findWithNotFinalStatusesAndUpdate(lang: Language = adminDefaultLanguage): Promise<Order[]> {
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
          order.logs.push({ time: new Date(), text: `Updated shipment status to "${order.shipment.status}" - ${order.shipment.statusDescription}, source=system` });
        }

        const oldOrderStatus = order.status;
        OrderService.updateOrderStatusByShipment(order);
        const newOrderStatus = order.status;
        if (newOrderStatus !== oldOrderStatus) {
          switch (newOrderStatus) {
            case OrderStatusEnum.SHIPPED:
              await this.shippedOrderPostActions(order, lang, session);
              break;
            case OrderStatusEnum.FINISHED:
              await this.finishedOrderPostActions(order, session);
              break;
          }

          order.logs.push({ time: new Date(), text: `Updated order status by shipment status to "${order.status}" - ${order.statusDescription[adminDefaultLanguage]}, source=system` });
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

  public async updateOrderShipment(orderId: number, shipmentDto: ShipmentDto, lang: Language): Promise<Order> {
    return await this.updateOrderById(orderId, lang, async order => {
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

  async getPaymentDetails(orderId: number, lang: Language): Promise<OnlinePaymentDetailsDto> {
    const order = await this.getOrderById(orderId, lang);

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
      itemNames.push(item.name[lang]);
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
      language: Language.RU.toUpperCase()
    }
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log(`Start reindex all search data`);
    const orders = await this.orderModel.find().sort({ _id: -1 }).exec();
    const dtos = orders.map(order => plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true }));

    await this.searchService.deleteCollection(Order.collectionName);
    await this.searchService.ensureCollection(Order.collectionName, new ElasticOrderModel());
    await this.searchService.addDocuments(Order.collectionName, dtos);

    this.logger.log(`Reindexed`);
  }

  async updateShipmentStatus(orderId: number, lang: Language): Promise<Order> {
    return this.updateOrderById(orderId, lang, async order => {
      await this.fetchShipmentStatus(order);
      return order;
    });
  }

  async changeStatus(orderId: number, status: OrderStatusEnum, user: DocumentType<User>, lang: Language) {
    return await this.updateOrderById(orderId, lang, async (order, session) => {

      const assertStatus = (statusToAssert: OrderStatusEnum) => {
        if (order.status !== statusToAssert) {
          throw new BadRequestException(__('Cannot change status to "$1": order must be with status "$2"', lang, status, statusToAssert));
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
            throw new BadRequestException(__('Cannot change status to "$1": order is not paid', lang, status));
          }
          break;

        case OrderStatusEnum.RETURNING:
        case OrderStatusEnum.REFUSED_TO_RETURN:
          assertStatus(OrderStatusEnum.RECIPIENT_DENIED);
          break;
        case OrderStatusEnum.RETURNED:
          for (const item of order.items) {
            await this.inventoryService.addToStock(item.sku, item.qty, session);
            await this.productService.updateSearchDataById(item.productId, lang, session);
          }
          break;

        case OrderStatusEnum.CANCELED:
          if (ShippedOrderStatuses.includes(status)) {
            throw new BadRequestException(__('Cannot cancel order with status "$1"', lang, status));
          }
          await this.cancelOrderPreActions(order, lang, session);
          break;

        case OrderStatusEnum.FINISHED:
          if (order.status === OrderStatusEnum.FINISHED) {
            throw new BadRequestException(__('Cannot change status to "$1": order must not be with status "$2"', lang, status, OrderStatusEnum.FINISHED));
          }

          if (!ShippedOrderStatuses.includes(order.status)) {
            await this.shippedOrderPostActions(order, lang, session);
          }
          await this.finishedOrderPostActions(order, session);
          break;

        default:
          throw new BadRequestException(__('Cannot change status to "$1": disallowed status', lang, status));
          break;
      }

      const oldStatus = order.status;
      order.status = status;

      order.logs.push({ time: new Date(), text: `Changed order status from "${oldStatus}" to "${order.status}", userLogin=${user?.login}` });

      return order;
    });
  }

  async createInternetDocument(orderId: number, shipmentDto: ShipmentDto, lang: Language): Promise<Order> {
    return this.updateOrderById(orderId, lang, async order => {
      if (shipmentDto.trackingNumber) {
        order.shipment.trackingNumber = shipmentDto.trackingNumber;
        order.status = OrderStatusEnum.PACKED;
        await this.fetchShipmentStatus(order);
      } else {
        OrderService.patchShipmentData(order.shipment, shipmentDto);

        const shipmentSender = await this.shipmentSenderService.getById(shipmentDto.senderId, lang);
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

  async changeOrderPaymentStatus(id: number, isPaid: boolean, user: DocumentType<User>, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
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
        order.logs.push({ time: new Date(), text: `Changed "isOrderPaid" from "${oldIsPaid}" to "${order.isOrderPaid}", userLogin=${user.login}` });
      }
      if (oldOrderStatus !== order.status) {
        order.logs.push({ time: new Date(), text: `Changed order status from "${oldOrderStatus}" to "${order.status}", userLogin=${user.login}` });
      }

      return order;
    });
  }

  async updateOrderAdminNote(id: number, adminNote: string, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
      order.adminNote = adminNote;
      return order;
    });
  }

  async updateOrderManager(id: number, userId: string, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
      await this.assignOrderManager(order, userId);
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
      shippedAt: {
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

  private static checkForCheckoutRules(order: Order, lang: Language) {
    const errors: string[] = [];
    const isCashOnDeliveryMethod = order.paymentType === PaymentTypeEnum.CASH_ON_DELIVERY;
    if (!isCashOnDeliveryMethod) { return; }

    if (order.shipment.recipient.addressType === AddressTypeEnum.DOORS) {
      errors.push(__('Cash on delivery is not available with address delivery', lang));
    }

    const disallowedItem = order.items.find(item => item.name[clientDefaultLanguage].toLowerCase().match(/сусаль([ ,])/g));
    if (disallowedItem) {
      errors.push(__('Cash on delivery is not available for gold leaf', lang));
    }

    if (errors.length) {
      throw new BadRequestException(errors);
    }
  }

  private static shouldAssignToKristina(order: Order): boolean {
    return order.items.some(item => item.name[clientDefaultLanguage].toLowerCase().includes('картина'));
  }
}
