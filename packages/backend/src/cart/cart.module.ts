import { Module } from '@nestjs/common';
import { BackendCartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendCart } from './models/cart.model';
import { BackendInventoryModule } from '../inventory/inventory.module';
import { BackendCartController } from './cart.controller';
import { BackendProductModule } from '../product/product.module';

const cartModel = {
  name: BackendCart.model.modelName,
  schema: BackendCart.model.schema,
  collection: BackendCart.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([cartModel]),
    BackendInventoryModule,
    BackendProductModule
  ],
  providers: [BackendCartService],
  controllers: [BackendCartController]
})
export class BackendCartModule {}
