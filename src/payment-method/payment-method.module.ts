import { Module } from '@nestjs/common';
import { AdminPaymentMethodController } from './admin-payment-method.controller';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethod, PaymentMethodModel } from './models/payment-method.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientPaymentMethodController } from './client-payment-method.controller';

const paymentMethodModel = {
  name: PaymentMethodModel.modelName,
  schema: PaymentMethodModel.schema,
  collection: PaymentMethod.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([paymentMethodModel])
  ],
  controllers: [AdminPaymentMethodController, ClientPaymentMethodController],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService]
})
export class PaymentMethodModule {}
