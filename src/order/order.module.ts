import { Module } from '@nestjs/common';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderModel } from './models/order.model';

const orderModel = {
  name: OrderModel.modelName,
  schema: OrderModel.schema,
  collection: Order.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([orderModel])
  ],
  controllers: [AdminOrderController],
  providers: [OrderService]
})
export class OrderModule {}
