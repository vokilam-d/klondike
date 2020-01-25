import { Module } from '@nestjs/common';
import { AdminOrderController } from './admin-order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderModel } from './models/order.model';
import { AdminOrderItemController } from './admin-order-item.controller';
import { OrderItemService } from './order-item.service';
import { ProductModule } from '../product/product.module';
import { CustomerModule } from '../customer/customer.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';

const orderModel = {
  name: OrderModel.modelName,
  schema: OrderModel.schema,
  collection: Order.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([orderModel]),
    ProductModule,
    CustomerModule,
    PdfGeneratorModule,
    InventoryModule
  ],
  controllers: [AdminOrderController, AdminOrderItemController],
  providers: [OrderService, OrderItemService]
})
export class OrderModule {}
