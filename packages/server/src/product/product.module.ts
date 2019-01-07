import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './models/product.model';
import { MongooseModule } from '@nestjs/mongoose';

const productModel = {
  name: Product.modelName,
  schema: Product.model.schema,
  collection: Product.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([productModel])],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
