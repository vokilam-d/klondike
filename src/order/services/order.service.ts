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
import { Order } from '../models/order.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminOrderDto } from '../../shared/dtos/admin/order.dto';
import { CounterService } from '../../shared/services/counter/counter.service';
import { CustomerService } from '../../customer/customer.service';
import { AdminAddOrUpdateCustomerDto } from '../../shared/dtos/admin/customer.dto';
import { InventoryService } from '../../inventory/inventory.service';
import { FinalOrderStatuses, OrderStatusEnum, ShippedOrderStatuses } from '../../shared/enums/order-status.enum';
import { getPropertyOf } from '../../shared/helpers/get-property-of.function';
import { PdfGeneratorService } from '../../pdf-generator/pdf-generator.service';
import { Customer } from '../../customer/models/customer.model';
import { AdminProductService } from '../../product/services/admin-product.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { SearchService } from '../../shared/services/search/search.service';
import { ElasticOrder } from '../models/elastic-order.model';
import { OrderFilterDto } from '../../shared/dtos/admin/order-filter.dto';
import { ClientSession, FilterQuery } from 'mongoose';
import { PaymentMethodService } from '../../payment-method/payment-method.service';
import { TasksService } from '../../tasks/tasks.service';
import { __ } from '../../shared/helpers/translate/translate.function';
import { NovaPoshtaService } from '../../nova-poshta/nova-poshta.service';
import { ShipmentSenderService } from '../../nova-poshta/shipment-sender.service';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { ShipmentStatusEnum } from '../../shared/enums/shipment-status.enum';
import { Shipment } from '../models/shipment.model';
import { PaymentTypeEnum } from '../../shared/enums/payment-type.enum';
import { OnlinePaymentDetailsDto } from '../../shared/dtos/client/online-payment-details.dto';
import { createHmac } from 'crypto';
import { isObject } from 'src/shared/helpers/is-object.function';
import { areAddressesSame } from '../../shared/helpers/are-addresses-same.function';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { User } from '../../user/models/user.model';
import { OrderItemService } from './order-item.service';
import { OrderItem } from '../models/order-item.model';
import { AddressTypeEnum } from '../../shared/enums/address-type.enum';
import { CurrencyCodeEnum } from '../../shared/enums/currency.enum';
import { Language } from '../../shared/enums/language.enum';
import { AdminOrderItemDto } from '../../shared/dtos/admin/order-item.dto';
import { ClientOrderItemDto } from '../../shared/dtos/client/order-item.dto';
import { adminDefaultLanguage, clientDefaultLanguage } from '../../shared/constants';
import { UserService } from 'src/user/user.service';
import { InvoiceEditDto } from '../../shared/dtos/admin/invoice-edit.dto';
import { PackOrderItemDto } from '../../shared/dtos/admin/pack-order-item.dto';
import { hasPermissions } from '../../shared/helpers/have-permissions.function';
import { Role } from '../../shared/enums/role.enum';
import { FastifyRequest } from 'fastify';
import { MediaService } from '../../shared/services/media/media.service';
import { CronProd } from '../../shared/decorators/prod-cron.decorator';
import { FileLogger } from '../../logger/file-logger.service';
import { Subject } from 'rxjs';
import { ClientAddOrderDto } from '../../shared/dtos/client/add-order.dto';
import { AdminAddOrUpdateOrderDto } from '../../shared/dtos/admin/add-or-update-order.dto';
import { CustomerContactInfo } from '../models/customer-contact-info.model';
import { AdminShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { CreateInternetDocumentDto } from '../../shared/dtos/admin/create-internet-document.dto';
import { ShipmentAddress } from '../../shared/models/shipment-address.model';
import { NovaPoshtaShipmentDto } from '../../shared/dtos/admin/nova-poshta-shipment.dto';
import { ShipmentAddressDto } from '../../shared/dtos/shared-dtos/shipment-address.dto';
import { OrderNotes } from '../models/order-notes.model';
import { ShipmentCounterparty } from '../../shared/models/shipment-counterparty.model';
import { OrderPaymentInfo } from '../models/order-payment-info.model';
import { ContactInfo } from '../../shared/models/contact-info.model';

@Injectable()
export class OrderService implements OnApplicationBootstrap {

  private logger = new Logger(OrderService.name);
  private cachedOrderCount: number;

  orderCreated$ = new Subject<{ order: Order, lang: Language }>();
  managerAssigned$ = new Subject<Order>();

  constructor(
    @InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
    @Inject(forwardRef(() => CustomerService)) private readonly customerService: CustomerService,
    @Inject(forwardRef(() => AdminProductService)) private readonly productService: AdminProductService,
    private readonly counterService: CounterService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly tasksService: TasksService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly inventoryService: InventoryService,
    private readonly orderItemService: OrderItemService,
    private readonly userService: UserService,
    private readonly mediaService: MediaService,
    private readonly searchService: SearchService,
    private readonly novaPoshtaService: NovaPoshtaService,
    private readonly shipmentSenderService: ShipmentSenderService,
    private readonly fileLogger: FileLogger
  ) {
    this.fileLogger.setContext(OrderService.name);
  }

  async onApplicationBootstrap() {
    this.searchService.ensureCollection(Order.collectionName, new ElasticOrder());
    // this.reindexAllSearchData();

    // (async () => {this.logger.log('Start find');
    // const orders = await this.orderModel.find().sort({_id: -1}).lean().exec();
    // this.logger.log('End find');
    //
    // for (const order of orders) {
    //   // const json = order.toJSON();
    //   const json = JSON.parse(JSON.stringify(order));
    //   const oldRecipientAddr = json.shipment.recipient;
    //   order.customerContactInfo = new CustomerContactInfo();
    //   order.customerContactInfo.firstName = json.customerFirstName;
    //   delete order['customerFirstName'];
    //   order.customerContactInfo.lastName = json.customerLastName;
    //   delete order['customerLastName'];
    //   order.customerContactInfo.email = json.customerEmail;
    //   delete order['customerEmail'];
    //   order.customerContactInfo.phoneNumber = json.customerPhoneNumber;
    //   delete order['customerPhoneNumber'];
    //   order.customerContactInfo.middleName = oldRecipientAddr.middleName || '';
    //
    //   order.paymentInfo = new OrderPaymentInfo();
    //   order.paymentInfo.methodId = json.paymentMethodId;
    //   delete order['paymentMethodId'];
    //   order.paymentInfo.type = json.paymentType;
    //   delete order['paymentType'];
    //   order.paymentInfo.methodClientName = json.paymentMethodClientName;
    //   delete order['paymentMethodClientName'];
    //   order.paymentInfo.methodAdminName = json.paymentMethodAdminName;
    //   delete order['paymentMethodAdminName'];
    //
    //   order.notes = new OrderNotes();
    //   order.notes.fromCustomer = json.clientNote || '';
    //   delete order['clientNote'];
    //   order.notes.fromAdmin = json.adminNote || '';
    //   delete order['adminNote'];
    //   order.notes.aboutCustomer = json.customerNote || '';
    //   delete order['customerNote'];
    //
    //   order.shipment.recipient = new ShipmentCounterparty();
    //   order.shipment.recipient.contactInfo = new ContactInfo();
    //   order.shipment.recipient.contactInfo.firstName = oldRecipientAddr.firstName;
    //   order.shipment.recipient.contactInfo.lastName = oldRecipientAddr.lastName;
    //   order.shipment.recipient.contactInfo.middleName = oldRecipientAddr.middleName || '';
    //   order.shipment.recipient.contactInfo.phoneNumber = oldRecipientAddr.phone || json.customerPhoneNumber;
    //   order.shipment.recipient.address = new ShipmentAddress();
    //   order.shipment.recipient.address.addressName = oldRecipientAddr.address || oldRecipientAddr.addressFull;
    //   order.shipment.recipient.address.addressNameFull = oldRecipientAddr.addressFull;
    //   order.shipment.recipient.address.settlementName = oldRecipientAddr.settlement || oldRecipientAddr.settlementFull;
    //   order.shipment.recipient.address.settlementNameFull = oldRecipientAddr.settlementFull;
    //   order.shipment.recipient.address.type = oldRecipientAddr.addressType;
    //   order.shipment.recipient.address.buildingNumber = oldRecipientAddr.buildingNumber;
    //   order.shipment.recipient.address.flat = oldRecipientAddr.flat;
    //   order.shipment.recipient.address._id = oldRecipientAddr._id;
    //
    //   const oldSenderAddr = json.shipment.sender;
    //   order.shipment.sender = new ShipmentCounterparty();
    //   order.shipment.sender.contactInfo = new ContactInfo();
    //   order.shipment.sender.contactInfo.firstName = oldSenderAddr.firstName;
    //   order.shipment.sender.contactInfo.lastName = oldSenderAddr.lastName;
    //   order.shipment.sender.contactInfo.middleName = oldSenderAddr.middleName;
    //   order.shipment.sender.contactInfo.phoneNumber = oldSenderAddr.phone;
    //   order.shipment.sender.address = new ShipmentAddress();
    //   order.shipment.sender.address.addressName = oldSenderAddr.address || oldSenderAddr.addressFull;
    //   order.shipment.sender.address.addressNameFull = oldSenderAddr.addressFull;
    //   order.shipment.sender.address.settlementName = oldSenderAddr.settlement || oldSenderAddr.settlementFull;
    //   order.shipment.sender.address.settlementNameFull = oldSenderAddr.settlementFull;
    //   order.shipment.sender.address.type = oldSenderAddr.addressType;
    //   order.shipment.sender.address.buildingNumber = oldSenderAddr.buildingNumber;
    //   order.shipment.sender.address.flat = oldSenderAddr.flat;
    //   order.shipment.sender.address._id = oldSenderAddr._id;
    //
    //   // console.dir(order.toJSON(), {depth: 10});
    //   // await order.save();
    //   // console.log('saved order', order.id);
    //   await this.orderModel.updateOne({_id:order._id}, order).exec();
    //   console.log('saved order', order._id);
    // }
    // console.log('saved order all');
    //   this.reindexAllSearchData()
    // })()
    //
    // this.reindexAllSearchData();
  }

  async getOrdersList(spf: OrderFilterDto): Promise<ResponseDto<AdminOrderDto[]>> {
    const searchResponse = await this.searchByFilters(spf);
    const orderDtos: AdminOrderDto[] = searchResponse[0];
    const itemsFiltered: number = searchResponse[1];
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

    const conditions: FilterQuery<Order> = {};
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

  async createOrderAdmin(addOrUpdateOrderDto: AdminAddOrUpdateOrderDto, lang: Language, user: DocumentType<User>): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      let customer: Customer;

      let address = addOrUpdateOrderDto.address;
      if (addOrUpdateOrderDto.customerId) {
        customer = await this.customerService.addAddressByCustomerId(addOrUpdateOrderDto.customerId, address, lang, session);

      } else {
        customer = await this.customerService.getCustomerByEmailOrPhoneNumber(addOrUpdateOrderDto.customerContactInfo.email);

        if (!customer) {
          const customerDto = new AdminAddOrUpdateCustomerDto();
          customerDto.contactInfo = addOrUpdateOrderDto.customerContactInfo;
          customerDto.addresses = [{ ...address, isDefault: true }];
          customer = await this.customerService.adminCreateCustomer(customerDto, lang, session);
        }

        addOrUpdateOrderDto.customerId = customer.id;
      }

      const newOrder = await this.createOrder(addOrUpdateOrderDto, lang, customer, session, 'manager', user);
      newOrder.notes.fromAdmin = addOrUpdateOrderDto.note;
      newOrder.status = OrderStatusEnum.PROCESSING;
      OrderService.addLog(newOrder, `Created order, source=${newOrder.source}, userLogin=${user?.login}`);

      await newOrder.save({ session });
      await session.commitTransaction();

      this.logger.log(`Created order by manager, orderId=${newOrder.id}, userLogin=${user?.login}`);

      this.addSearchData(newOrder).then();
      this.updateCachedOrderCount();
      this.orderCreated$.next({ order: newOrder, lang });

      return newOrder;

    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async createOrderClient(addOrderDto: ClientAddOrderDto, lang: Language, customer: DocumentType<Customer>): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      if (!customer) {
        customer = await this.customerService.getCustomerByEmailOrPhoneNumber(addOrderDto.customerContactInfo.email);
      }

      if (customer) {
        await this.customerService.emptyCart(customer, session);

        const hasSameAddress = customer.addresses.find(address => areAddressesSame(address, addOrderDto.address));
        if (!hasSameAddress) {
          await this.customerService.addCustomerAddress(customer, addOrderDto.address, session);
        }

      } else {
        const customerDto = new AdminAddOrUpdateCustomerDto();
        customerDto.contactInfo = addOrderDto.customerContactInfo;
        customerDto.addresses = [{ ...addOrderDto.address, isDefault: true }];
        customer = await this.customerService.adminCreateCustomer(customerDto, lang, session);
      }

      const prices = await this.orderItemService.calcOrderPrices(addOrderDto.items, customer, lang);

      const newOrder = await this.createOrder({ ...addOrderDto, prices }, lang, customer, session, 'client');
      newOrder.notes.fromCustomer = addOrderDto.note;

      OrderService.checkForCheckoutRules(newOrder, lang);

      newOrder.status = OrderStatusEnum.NEW;
      OrderService.addLog(newOrder, `Created order, source=${newOrder.source}`);

      await newOrder.save({ session });
      await session.commitTransaction();

      this.logger.log(`Created order, source=${newOrder.source}, orderId=${newOrder.id}, customerId=${customer.id}`);

      this.addSearchData(newOrder).then();
      this.updateCachedOrderCount();

      this.orderCreated$.next({ order: newOrder, lang });
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
    newOrder.customerId = customer.id;
    newOrder.notes.aboutCustomer = customer.note;
    newOrder.shipment.recipient.contactInfo = orderDto.recipientContactInfo || orderDto.customerContactInfo;
    newOrder.shipment.recipient.address = orderDto.address;
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
      newOrder.items[i] = await this.orderItemService.createOrderItem({
        sku,
        qty,
        additionalServiceIds,
        omitReserved: false
      }, lang, false, product, variant);

      await this.inventoryService.addToOrdered(sku, qty, newOrder.id, session);
      await this.productService.updateSearchDataById(productId, lang, session);
    }

    await this.customerService.addOrderToCustomer(customer.id, newOrder.id, session);

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

      const isManagerChanged = order.manager?.userId && (order.manager?.userId !== orderDto.manager?.userId);
      if (isManagerChanged && !hasPermissions(user, Role.SeniorManager)) {
        throw new ForbiddenException(__('You do not have enough permissions to change assigned manager', lang));
      }

      for (const item of order.items) {
        await this.inventoryService.removeFromOrdered(item.sku, orderId, session);
        await this.productService.updateSearchDataById(item.productId, lang, session);
      }
      for (const item of orderDto.items) {
        await this.inventoryService.addToOrdered(item.sku, item.qty, orderId, session);
        await this.productService.updateSearchDataById(item.productId, lang, session);
      }

      Object.keys(orderDto).forEach(key => order[key] = orderDto[key]);
      order.shipment.recipient.contactInfo = orderDto.recipientContactInfo;
      order.shipment.recipient.address = orderDto.address;

      await this.setPaymentInfoByMethodId(order, orderDto.paymentMethodId);

      OrderService.addLog(order, `Edited order, userLogin=${user?.login}`);

      return order;
    });
  }

  private async assignOrderManager(order: Order, newManagerUserId: string, user: User) {
    let assignedManagerUser: User;
    if (newManagerUserId) {
      assignedManagerUser = await this.userService.getUserById(newManagerUserId);
    } else if (user) {
      assignedManagerUser = user;
    } else if (await this.shouldAssignToKristina(order)) {
      assignedManagerUser = await this.userService.getUserById('5fff628d7db0790020149858'); // Кристина
    } else {
      assignedManagerUser = await this.userService.getUserById('5ef9c63aae2fd882393081c3'); // default Елена
    }

    const newOrderManagerUserId = assignedManagerUser.id.toString();
    const oldOrderManagerUserId = order.manager?.userId;

    order.manager = { name: assignedManagerUser.name, userId: newOrderManagerUserId };

    if (newOrderManagerUserId === oldOrderManagerUserId) {
      return;
    }

    let assignedManagerMessage = `Assigned to manager ${assignedManagerUser.name}, orderId=${order.id}`;
    if (user) {
      assignedManagerMessage += `, source=admin, userLogin=${user.login}`;
    } else {
      assignedManagerMessage += `, source=system`;
    }

    OrderService.addLog(order, assignedManagerMessage);
    this.logger.log(assignedManagerMessage);
    // this.emailService.sendAssignedOrderManagerEmail(order, assignedManagerUser).then();
    this.managerAssigned$.next(order);
  }

  async deleteOrder(orderId: number, user: DocumentType<User>, lang: Language): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {

      const order = await this.orderModel.findByIdAndDelete(orderId).session(session).exec();
      if (!order) {
        throw new NotFoundException(__('Order with id "$1" not found', lang, orderId));
      }

      if (order.status !== OrderStatusEnum.CANCELED) {
        await this.cancelOrderPreActions(order, lang, session);
      }
      await this.customerService.removeOrderFromCustomer(order.id, session);

      await session.commitTransaction();

      this.logger.log(`Deleted order #${order.id}, userLogin=${user?.login}`);

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

  @CronProd(CronExpression.EVERY_30_MINUTES)
  private updateCachedOrderCount() {
    this.orderModel.estimatedDocumentCount().exec()
      .then(count => this.cachedOrderCount = count)
      .catch(_ => {
      });
  }

  private async cancelOrderPreActions(order: Order, lang: Language, session: ClientSession): Promise<void> {
    for (const item of order.items) {
      await this.inventoryService.removeFromOrdered(item.sku, order.id, session);
      await this.productService.updateSearchDataById(item.productId, lang, session);
    }
  }

  private async shippedOrderPostActions(order: Order, session: ClientSession): Promise<Order> {
    for (const item of order.items) {
      await this.inventoryService.removeFromOrderedAndStock(item.sku, item.qty, order.id, session);
      await this.productService.incrementSalesCount(item.productId, item.variantId, item.qty, session);
      await this.productService.updateSearchDataById(item.productId, adminDefaultLanguage, session);
    }

    order.shippedAt = new Date();
    OrderService.addLog(order, `Order has been shipped`);

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

  async printInvoice(orderId: number, editDto: InvoiceEditDto, lang: Language) {
    const order = await this.getOrderById(orderId, lang);
    return {
      fileName: `${editDto.title} №${order.id}.pdf`,
      pdf: await this.pdfGeneratorService.generateInvoicePdf(order.toJSON(), editDto)
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

    if (spf.productId) {
      const itemsProp = getPropertyOf<AdminOrderDto>('items');
      const productIdProp = getPropertyOf<AdminOrderItemDto>('productId');
      filters.push({ fieldName: `${itemsProp}.${productIdProp}`, values: [spf.productId] });
    }

    return this.searchService.searchByFilters<AdminOrderDto>(
      Order.collectionName,
      filters,
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticOrder()
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
      const shipments: NovaPoshtaShipmentDto[] = await this.novaPoshtaService.fetchShipments(trackingNumbers);

      for (const order of orders) {
        const shipment: NovaPoshtaShipmentDto = shipments.find(ship => ship.trackingNumber === order.shipment.trackingNumber);
        if (!shipment) {
          continue;
        }

        const oldShipmentStatus = order.shipment.status;
        order.shipment.status = shipment.status;
        order.shipment.statusDescription = shipment.statusDescription;
        const newShipmentStatus = order.shipment.status;

        if (newShipmentStatus !== oldShipmentStatus) {
          OrderService.addLog(order, `Updated shipment status to "${order.shipment.status} - ${order.shipment.statusDescription}", source=system`);
        }

        await this.updateOrderStatusByShipment(order, session);
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

  public async updateRecipientAddress(orderId: number, addressDto: ShipmentAddressDto, user: User, lang: Language): Promise<Order> {
    return await this.updateOrderById(orderId, lang, async (order, session) => {
      order.shipment.recipient.address = addressDto;

      OrderService.addLog(order, `Edited order shipment recipient address, userLogin=${user?.login}`);
      return order;
    });
  }

  public async updateTrackingNumber(orderId: number, newTrackingNumber: string, user: User, lang: Language): Promise<Order> {
    return await this.updateOrderById(orderId, lang, async (order, session) => {
      if (newTrackingNumber === order.shipment.trackingNumber) {
        return order;
      }
      const oldTrackingNumber = order.shipment.trackingNumber;
      order.shipment.trackingNumber = newTrackingNumber;

      await this.fetchShipmentStatus(order, session);
      OrderService.addLog(order, `Edited order shipment tracking number, oldTrackingNumber=${oldTrackingNumber}, newTrackingNumber=${newTrackingNumber} userLogin=${user?.login}`);
      return order;
    });
  }

  private async fetchShipmentStatus(order, session: ClientSession): Promise<void> {
    let status: string = '';
    let statusDescription: string = '';
    let estimatedDeliveryDate: string = '';

    if (order.shipment.trackingNumber) {
      const shipmentDto: NovaPoshtaShipmentDto = await this.novaPoshtaService.fetchShipment(order.shipment.trackingNumber);
      status = shipmentDto?.status || '';
      statusDescription = shipmentDto?.statusDescription || '';
      estimatedDeliveryDate = shipmentDto?.scheduledDeliveryDate || '';
    }

    order.shipment.status = status;
    order.shipment.statusDescription = statusDescription;
    order.shipment.estimatedDeliveryDate = estimatedDeliveryDate;

    await this.updateOrderStatusByShipment(order, session);
  }

  private static patchShipmentData(shipment: Shipment, shipmentDto: AdminShipmentDto) {
    const copyValues = (fromObject: any, toObject: any) => {
      for (const key of Object.keys(fromObject)) {
        if (fromObject[key] === undefined) {
          continue;
        }

        if (isObject(fromObject[key])) {
          copyValues(fromObject[key], toObject[key]);
        } else {
          toObject[key] = fromObject[key];
        }
      }
    };

    copyValues(shipmentDto, shipment);
  }

  private async updateOrderStatusByShipment(order: Order, session: ClientSession): Promise<void> {
    const oldStatus = order.status;
    const isCashOnDelivery = order.paymentInfo.type === PaymentTypeEnum.CASH_ON_DELIVERY;
    const isReceived = order.shipment.status === ShipmentStatusEnum.RECEIVED;
    const isCashPickedUp = order.shipment.status === ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP;
    const isShipped = order.shipment.status === ShipmentStatusEnum.HEADING_TO_CITY
      || order.shipment.status === ShipmentStatusEnum.IN_CITY;

    if ((!isCashOnDelivery && isReceived || isCashOnDelivery && isCashPickedUp) && order.status !== OrderStatusEnum.FINISHED) {
      order.status = OrderStatusEnum.FINISHED;
      await this.finishedOrderPostActions(order, session);
    } else if (order.shipment.status === ShipmentStatusEnum.RECIPIENT_DENIED) {
      order.status = OrderStatusEnum.RECIPIENT_DENIED;
    } else if (isShipped && order.status !== OrderStatusEnum.SHIPPED) {
      order.status = OrderStatusEnum.SHIPPED;
      await this.shippedOrderPostActions(order, session);
    }

    if (oldStatus !== order.status) {
      let logMessage = `Updated order status by shipment status to "${order.status} - ${order.statusDescription[adminDefaultLanguage]}"`;
      OrderService.addLog(order, logMessage);
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
      .update([merchantAccount, merchantDomainName, orderReference, orderDate, amount, currency, ...itemNames, ...itemCounts, ...itemPrices].join(';'))
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
      clientFirstName: order.customerContactInfo.firstName,
      clientLastName: order.customerContactInfo.lastName,
      clientEmail: order.customerContactInfo.email,
      clientPhone: order.customerContactInfo.phoneNumber,
      language: Language.RU.toUpperCase()
    };
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log(`Start reindex all search data`);
    const orders = await this.orderModel.find().exec();
    this.logger.log(`Start map to dtos`);
    const dtos = orders.map(order => plainToClass(AdminOrderDto, order, { excludeExtraneousValues: true }));

    this.logger.log(`Start delete collection`);
    await this.searchService.deleteCollection(Order.collectionName);
    this.logger.log(`Start ensure collection`);
    await this.searchService.ensureCollection(Order.collectionName, new ElasticOrder());

    const threshold = 5000;
    let currentStartIdx = 0;
    while (currentStartIdx < dtos.length) {
      const filteredDtos = dtos.slice(currentStartIdx, currentStartIdx + threshold);
      this.logger.log(`Start adding ${filteredDtos.length} documents (${currentStartIdx}-${currentStartIdx + filteredDtos.length})`);
      await this.searchService.addDocuments(Order.collectionName, filteredDtos);
      this.logger.log(`Reindexed ${filteredDtos.length} items (${currentStartIdx}-${currentStartIdx + filteredDtos.length})`);

      currentStartIdx += threshold;
    }

    this.logger.log(`Reindexed finished`);
  }

  async updateShipmentStatus(orderId: number, lang: Language): Promise<Order> {
    return this.updateOrderById(orderId, lang, async (order, session) => {
      await this.fetchShipmentStatus(order, session);
      return order;
    });
  }

  async changeStatus(orderId: number, status: OrderStatusEnum, user: DocumentType<User>, lang: Language) {
    return await this.updateOrderById(orderId, lang, async (order, session) => {

      const assertStatus = (statusToAssert: OrderStatusEnum) => {
        if (order.status !== statusToAssert) {
          throw new BadRequestException(__('Cannot change status to "$1": order must be with status "$2"', lang, status, statusToAssert));
        }
      };

      switch (status) {
        case OrderStatusEnum.PROCESSING:
          assertStatus(OrderStatusEnum.NEW);
          break;

        case OrderStatusEnum.READY_TO_PACK:
          assertStatus(OrderStatusEnum.PROCESSING);
          break;

        case OrderStatusEnum.PACKED:
          assertStatus(OrderStatusEnum.READY_TO_PACK);
          if (order.items.some(item => item.isPacked !== true) && order.medias.length === 0) {
            throw new BadRequestException(__('Cannot change status to "$1": attach photo or pack all order items', lang, status));
          }
          break;

        case OrderStatusEnum.READY_TO_SHIP:
          assertStatus(OrderStatusEnum.PACKED);
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
            await this.shippedOrderPostActions(order, session);
          }
          await this.finishedOrderPostActions(order, session);
          break;

        default:
          throw new BadRequestException(__('Cannot change status to "$1": disallowed status', lang, status));
          break;
      }

      const oldStatus = order.status;
      order.status = status;

      OrderService.addLog(order, `Changed order status from "${oldStatus}" to "${order.status}", userLogin=${user?.login}`);

      return order;
    });
  }

  async createInternetDocument(orderId: number, createIntDocDto: CreateInternetDocumentDto, user: User, lang: Language): Promise<Order> {
    return this.updateOrderById(orderId, lang, async (order, session) => {
      const isItemsNotPacked = order.items.some(item => item.isPacked !== true);
      const hasNoMedias = order.medias.length === 0;
      if (isItemsNotPacked && hasNoMedias) {
        throw new BadRequestException(__('Cannot create internet document: attach a photo or pack all items', lang));
      }

      order.status = OrderStatusEnum.PACKED;
      if (order.paymentInfo.type === PaymentTypeEnum.CASH_ON_DELIVERY || order.isOrderPaid) {
        order.status = OrderStatusEnum.READY_TO_SHIP;
      }

      let logMessage: string = '';

      if (createIntDocDto.trackingNumber) {
        order.shipment.trackingNumber = createIntDocDto.trackingNumber;
        await this.fetchShipmentStatus(order, session);

        logMessage = `Set tracking number manually`;

      } else {
        order.shipment.recipient.address = plainToClass(ShipmentAddress, createIntDocDto, { excludeExtraneousValues: true });

        const shipmentSender = await this.shipmentSenderService.getById(createIntDocDto.senderId, lang);
        order.shipment.sender.contactInfo.firstName = shipmentSender.firstName;
        order.shipment.sender.contactInfo.lastName = shipmentSender.lastName;
        order.shipment.sender.contactInfo.phoneNumber = shipmentSender.phone;
        order.shipment.sender.address.addressId = shipmentSender.address;
        order.shipment.sender.address.settlementId = shipmentSender.city;
        order.shipment.sender.address.type = shipmentSender.addressType;

        this.fileLogger.log(`Creating internet document for orderId=${order.id}, cost=${createIntDocDto.cost}, payerType=${createIntDocDto.payerType}, backwardMoneyDelivery=${createIntDocDto.backwardMoneyDelivery}...`);

        const {
          trackingNumber,
          estimatedDeliveryDate
        } = await this.novaPoshtaService.createInternetDocument(order.shipment, shipmentSender, order.paymentInfo.type);
        order.shipment.trackingNumber = trackingNumber;
        order.shipment.estimatedDeliveryDate = estimatedDeliveryDate;
        order.shipment.status = ShipmentStatusEnum.AWAITING_TO_BE_RECEIVED_FROM_SENDER;
        order.shipment.statusDescription = 'Новая почта ожидает поступление';

        logMessage = `Created internet document`;
        this.fileLogger.log(`${logMessage}, trackingNumber=${trackingNumber}`);
      }

      OrderService.addLog(order, `${logMessage}, trackingNumber=${order.shipment.trackingNumber}, orderStatus=${order.status}, shipmentStatus=${order.shipment.status}, userLogin=${user?.login}`);

      return order;
    });
  }

  async uploadMedia(request: FastifyRequest, id: number, login: string, lang: Language): Promise<Order> {
    const media = await this.mediaService.upload(request, Order.collectionName, false, true);

    return await this.updateOrderById(id, lang, async order => {
      order.medias = order.medias || [];
      order.medias.push(media);

      OrderService.addLog(order, `Uploaded media "${media.variantsUrls.original}", userLogin=${login}`);
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
        OrderService.addLog(order, `Changed "isOrderPaid" from "${oldIsPaid}" to "${order.isOrderPaid}", userLogin=${user?.login}`);
      }
      if (oldOrderStatus !== order.status) {
        OrderService.addLog(order, `Changed order status from "${oldOrderStatus}" to "${order.status}", userLogin=${user?.login}`);
      }

      return order;
    });
  }

  async packOrderItem(id: number, packDto: PackOrderItemDto, user: User, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
      const orderItem = order.items.find(item => item.sku === packDto.sku);
      if (!orderItem) {
        throw new BadRequestException(__('Order item with sku "$1" is not found in order "#$2"', lang, packDto.sku, order.id));
      }
      if (packDto.qty !== orderItem.qty) {
        throw new BadRequestException(__('Wrong quantity of order item "$1" is packed. Packed: "$2". Should be: "$3"', lang, packDto.sku, packDto.qty, orderItem.qty));
      }

      orderItem.isPacked = true;

      OrderService.addLog(order, `Order item has been packed, sku=${packDto.sku}, qty=${packDto.qty}, userLogin=${user?.login}`);

      return order;
    });
  }

  async updateOrderAdminNote(id: number, adminNote: string, user: User, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
      const oldNote = order.notes.fromAdmin;
      order.notes.fromAdmin = adminNote;
      OrderService.addLog(order, `Changed admin note, oldNote=${oldNote}, newNote=${adminNote}, userLogin=${user?.login}`);
      return order;
    });
  }

  async updateOrderManager(id: number, newManagerUserId: string, user: User, lang: Language): Promise<Order> {
    return await this.updateOrderById(id, lang, async order => {
      const isManagerChanged = order.manager?.userId && (order.manager?.userId !== newManagerUserId);
      if (isManagerChanged && !hasPermissions(user, Role.SeniorManager)) {
        throw new ForbiddenException(__('You do not have enough permissions to change assigned manager', lang));
      }

      await this.assignOrderManager(order, newManagerUserId, user);
      return order;
    });
  }

  private async setPaymentInfoByMethodId(order: Order, paymentMethodId: string): Promise<Order> {
    if (order.paymentInfo.methodId === paymentMethodId) {
      return order;
    }

    const paymentMethod = await this.paymentMethodService.getPaymentMethodById(paymentMethodId);
    order.paymentInfo.type = paymentMethod.paymentType;
    order.paymentInfo.methodId = paymentMethodId;
    order.paymentInfo.methodAdminName = paymentMethod.adminName;
    order.paymentInfo.methodClientName = paymentMethod.clientName;

    return order;
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
        ...(dateFrom ? { $gte: dateFrom } : {}),
        ...(dateTo ? { $lte: dateTo } : {})
      }
    };

    const itemsProp: keyof Order = 'items';
    const productIdProp: keyof OrderItem = 'productId';
    const qtyProp: keyof OrderItem = 'qty';
    const projection = {
      [`${itemsProp}.${productIdProp}`]: 1,
      [`${itemsProp}.${qtyProp}`]: 1
    };

    return this.orderModel.find(filterQuery, projection).exec();
  }

  private static checkForCheckoutRules(order: Order, lang: Language) {
    const errors: string[] = [];
    const isCashOnDeliveryMethod = order.paymentInfo.type === PaymentTypeEnum.CASH_ON_DELIVERY;
    if (!isCashOnDeliveryMethod) {
      return;
    }

    if (order.shipment.recipient.address.type === AddressTypeEnum.DOORS) {
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

  private async shouldAssignToKristina(order: Order): Promise<boolean> {
    const purchasedProductIds = order.items.map(item => item.productId);
    const products = await this.productService.getProductsWithQtyByIds(purchasedProductIds);
    return !products.flatMap(product => product.categories).some(category => category.id == 3); // Not gilding product
  }

  private static addLog(order: Order, message: string): void {
    order.logs.push({ time: new Date(), text: message });
  }
}
