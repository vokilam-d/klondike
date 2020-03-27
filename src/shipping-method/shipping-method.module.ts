import { Module } from '@nestjs/common';
import { AdminShippingMethodController } from './admin-shipping-method.controller';
import { ShippingMethodService } from './shipping-method.service';
import { ShippingMethod, ShippingMethodModel } from './models/shipping-method.model';
import { MongooseModule } from '@nestjs/mongoose';

const shippingMethodModel = {
  name: ShippingMethodModel.modelName,
  schema: ShippingMethodModel.schema,
  collection: ShippingMethod.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([shippingMethodModel])
  ],
  controllers: [AdminShippingMethodController],
  providers: [ShippingMethodService],
  exports: [ShippingMethodService]
})
export class ShippingMethodModule {}
