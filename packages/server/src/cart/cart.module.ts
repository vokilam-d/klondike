import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart } from './models/cart.model';
import { InventoryModule } from '../inventory/inventory.module';
import { CartController } from './cart.controller';
import { ProductModule } from '../product/product.module';

const cartModel = {
  name: Cart.model.modelName,
  schema: Cart.model.schema,
  collection: Cart.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([cartModel]),
    InventoryModule,
    ProductModule
  ],
  providers: [CartService],
  controllers: [CartController]
})
export class CartModule {}
