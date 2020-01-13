import { Module } from '@nestjs/common';
import { AdminPaymentMethodController } from './admin-payment-method.controller';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethod, PaymentMethodModel } from './models/payment-method.model';
import { MongooseModule } from '@nestjs/mongoose';

const paymentMethodModel = {
  name: PaymentMethodModel.modelName,
  schema: PaymentMethodModel.schema,
  collection: PaymentMethod.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([paymentMethodModel])
  ],
  controllers: [AdminPaymentMethodController],
  providers: [PaymentMethodService]
})
export class PaymentMethodModule {}
