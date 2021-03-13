import { forwardRef, Module } from '@nestjs/common';
import { AdminOrderController } from './controllers/admin-order.controller';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderModel } from './models/order.model';
import { AdminOrderItemController } from './controllers/admin-order-item.controller';
import { OrderItemService } from './services/order-item.service';
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
import { EmailModule } from '../email/email.module';
import { AdditionalServiceModule } from '../additional-service/additional-service.module';
import { UserModule } from '../user/user.module';
import { AdminOrderMediaController } from './controllers/admin-order-media.controller';

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
    forwardRef(() => ProductModule),
    EmailModule,
    TasksModule,
    ShippingMethodModule,
    UserModule,
    PaymentMethodModule,
    PdfGeneratorModule,
    InventoryModule,
    NovaPoshtaModule,
    AdditionalServiceModule
  ],
  controllers: [AdminOrderController, AdminOrderItemController, AdminOrderMediaController, ClientOrderController],
  providers: [OrderService, OrderItemService],
  exports: [OrderService, OrderItemService]
})
export class OrderModule {}
