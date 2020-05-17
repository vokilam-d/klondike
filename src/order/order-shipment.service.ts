import { CronExpression } from '@nestjs/schedule';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './models/order.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { NovaPoshtaService } from '../nova-poshta/nova-poshta.service';
import { OrderService } from './order.service';
import { ShipmentStatusEnum } from '../shared/enums/shipment-status.enum';
import { OrderStatusEnum } from '../shared/enums/order-status.enum';
import { ProdPrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { PaymentMethodEnum } from '../shared/enums/payment-method.enum';
import { Shipment } from './models/shipment.model';
import { ShipmentSenderService } from '../nova-poshta/shipment-sender.service';
import { plainToClass } from 'class-transformer';
import { __ } from '../shared/helpers/translate/translate.function';
import { from } from 'rxjs';

@Injectable()
export class OrderShipmentService {

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private readonly orderService: OrderService,
              private readonly novaPoshtaService: NovaPoshtaService,
              private readonly shipmentSenderService: ShipmentSenderService) {
  }

  @ProdPrimaryInstanceCron(CronExpression.EVERY_HOUR)
  public async getOrdersWithLatestShipmentStatuses(): Promise<Order[]> {
    return await this.orderService.updateOrdersByStatus(OrderStatusEnum.SHIPPED,
        orders => this.updateShipmentStatus(orders));
  }

  private async updateShipmentStatus(orders: Order[]): Promise<Order[]> {
    const ordersWithShipments: Order[] = orders
      .filter(order => order.shipment && order.shipment.trackingNumber);

    let shipments: ShipmentDto[] = ordersWithShipments.map(order => ({
      trackingNumber: order.shipment.trackingNumber
    }));

    shipments = await this.novaPoshtaService.fetchShipments(shipments);

    ordersWithShipments.forEach(order => {
      const shipment: ShipmentDto = shipments.find(ship => ship.trackingNumber === order.shipment.trackingNumber);
      order.shipment.status = shipment.status;
      order.shipment.statusDescription = shipment.statusDescription;
      OrderShipmentService.updateOrderStatus(order);
    });

    return ordersWithShipments;
  }

  public async createInternetDocument(orderId: number, shipmentDto: ShipmentDto) {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) {
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }
      OrderShipmentService.updateShipmentData(order.shipment, shipmentDto);
      shipmentDto = plainToClass(ShipmentDto, order.shipment, { excludeExtraneousValues: true });

      const shipmentSender = await this.shipmentSenderService.getById(shipmentDto.sender.id);

      shipmentDto = await this.novaPoshtaService.createInternetDocument(shipmentDto, shipmentSender,
        '' + order.totalItemsCost, order.paymentType);
      order.shipment.trackingNumber = shipmentDto.trackingNumber;
      order.shipment.estimatedDeliveryDate = shipmentDto.estimatedDeliveryDate;
      order.shipment.status = ShipmentStatusEnum.AWAITING_TO_BE_RECEIVED_FROM_SENDER;
      order.shipment.statusDescription = 'Готово к отправке';

      await order.save({ session });
      await this.orderService.updateSearchData(order);
      await session.commitTransaction();
      return order;
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  public async updateOrderShipment(orderId: number, shipmentDto: ShipmentDto): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) {
        throw new NotFoundException(__('Order with id "$1" not found', 'ru', orderId));
      }

      if (!order.shipment) {
        order.shipment = {};
      }

      OrderShipmentService.updateShipmentData(order.shipment, shipmentDto);

      if (shipmentDto.trackingNumber) {
        const novaPoshtaShipmentDto: ShipmentDto = await this.novaPoshtaService.fetchShipment(shipmentDto);
        if (novaPoshtaShipmentDto) {
          order.shipment.statusDescription = novaPoshtaShipmentDto.statusDescription;
          order.shipment.status = novaPoshtaShipmentDto.status;
        }
        OrderShipmentService.updateOrderStatus(order);
      }

      const updated = await order.save({ session });
      await this.orderService.updateSearchData(order);
      await session.commitTransaction();
      return updated;
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  private static updateShipmentData(shipment: Shipment, shipmentDto: ShipmentDto) {
    if (!shipment.recipient) {
      shipment.recipient = {};
    }

    if (!shipment.sender) {
      shipment.sender = {};
    }

    this.copyValues(shipmentDto, shipment);
    this.copyValues(shipmentDto.recipient, shipment.recipient);
    this.copyValues(shipmentDto.sender, shipment.sender);
  }

  private static copyValues(fromObject, toObject) {
    if (fromObject) {
      Object.keys(fromObject).forEach(key => {
        if (fromObject[key]) {
          toObject[key] = fromObject[key];
        }
      });
    }
  }

  private static updateOrderStatus(order) {
    const isCashOnDelivery = order.paymentType === PaymentMethodEnum.CASH_ON_DELIVERY;
    if (isCashOnDelivery && order.shipment.status === ShipmentStatusEnum.RECEIVED
            || !isCashOnDelivery && order.shipment.status === ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP) {
      order.status = OrderStatusEnum.FINISHED;
    } else {
      order.status = OrderStatusEnum.SHIPPED;
    }
  }

}
