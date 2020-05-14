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
import { PaymentTypeEnum } from '../shared/enums/payment-type.enum';
import { ProdPrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';

@Injectable()
export class OrderShipmentService {

  constructor(@InjectModel(Order.name) private readonly orderModel: ReturnModelType<typeof Order>,
              private readonly orderService: OrderService,
              private readonly novaPoshtaService: NovaPoshtaService) {
  }

  @ProdPrimaryInstanceCron(CronExpression.EVERY_HOUR)
  public async getOrdersWithLatestShipmentStatuses(): Promise<Order[]> {
    return await this.orderService.updateOrdersByStatus(
      OrderStatusEnum.SHIPPED,
      orders => this.updateShipmentStatus(orders)
    );
  }

  private async updateShipmentStatus(orders: Order[]): Promise<Order[]> {
    const ordersWithShipments: Order[] = orders
      .filter(order => order.shipment?.trackingNumber);

    let shipments: ShipmentDto[] = ordersWithShipments.map(order => ({
      trackingNumber: order.shipment.trackingNumber,
      senderPhone: order.shipment.senderPhone
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

  public async editOrderShipment(orderId: number, shipmentDto: ShipmentDto): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session).exec();
      if (!order) {
        throw new NotFoundException(`Order with id '${orderId}' not found`);
      }

      OrderShipmentService.merge(order, shipmentDto);

      const novaPoshtaShipmentDto: ShipmentDto = await this.novaPoshtaService.fetchShipment(shipmentDto);
      if (novaPoshtaShipmentDto) {
        order.shipment.statusDescription = novaPoshtaShipmentDto.statusDescription;
        order.shipment.status = novaPoshtaShipmentDto.status;
      }

      OrderShipmentService.updateOrderStatus(order);

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

  private static merge(order, shipmentDto: ShipmentDto) {
    if (!order.shipment) {
      order.shipment = {
        trackingNumber: shipmentDto.trackingNumber,
        senderPhone: shipmentDto.senderPhone
      };
    } else {
      if (shipmentDto.trackingNumber) {
        order.shipment.trackingNumber = shipmentDto.trackingNumber;
      }
      if (shipmentDto.senderPhone) {
        order.shipment.senderPhone = shipmentDto.senderPhone;
      }
    }
  }

  private static updateOrderStatus(order) {
    const isCashOnDelivery = order.paymentType === PaymentTypeEnum.CASH_ON_DELIVERY;

    if (
      isCashOnDelivery && order.shipment.status === ShipmentStatusEnum.RECEIVED
      || !isCashOnDelivery && order.shipment.status === ShipmentStatusEnum.CASH_ON_DELIVERY_PICKED_UP
    ) {
      order.status = OrderStatusEnum.FINISHED;
    } else {
      order.status = OrderStatusEnum.SHIPPED;
    }
  }

}
