import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartModel } from './models/cart.model';
import { InventoryModule } from '../inventory/inventory.module';
import { CartController } from './cart.controller';
import { ProductModule } from '../product/product.module';

const cartModel = {
  name: CartModel.modelName,
  schema: CartModel.schema,
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
