import { forwardRef, Module } from '@nestjs/common';
import { AdminOrderController } from './controllers/admin-order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderModel } from './models/order.model';
import { AdminOrderItemController } from './controllers/admin-order-item.controller';
import { OrderItemService } from './order-item.service';
import { ProductModule } from '../product/product.module';
import { CustomerModule } from '../customer/customer.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PdfGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { ShippingMethodModule } from '../shipping-method/shipping-method.module';
import { PaymentMethodModule } from '../payment-method/payment-method.module';
import { ClientOrderController } from './controllers/client-order.controller';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { NovaPoshtaModule } from '../nova-poshta/nova-poshta.module';

const orderModel = {
  name: OrderModel.modelName,
  schema: OrderModel.schema,
  collection: Order.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([orderModel]),
    forwardRef(() => CustomerModule),
    forwardRef(() => AuthModule),
    ProductModule,
    TasksModule,
    ShippingMethodModule,
    PaymentMethodModule,
    PdfGeneratorModule,
    InventoryModule,
    NovaPoshtaModule
  ],
  controllers: [AdminOrderController, AdminOrderItemController, ClientOrderController],
  providers: [OrderService, OrderItemService],
  exports: [OrderService, OrderItemService]
})
export class OrderModule {}
