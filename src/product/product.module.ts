import { forwardRef, Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { Product, ProductModel } from './models/product.model';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryModule } from '../inventory/inventory.module';
import { PageRegistryModule } from '../page-registry/page-registry.module';
import { ClientProductController } from './controllers/client-product.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { ProductReviewModule } from '../reviews/product-review/product-review.module';
import { CategoryModule } from '../category/category.module';
import { AttributeModule } from '../attribute/attribute.module';
import { CurrencyModule } from '../currency/currency.module';
import { OrderModule } from '../order/order.module';
import { OrderedProductService } from './services/ordered-product.service';

const productModel = {
  name: ProductModel.modelName,
  schema: ProductModel.schema,
  collection: Product.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([productModel]),
    InventoryModule,
    AttributeModule,
    PageRegistryModule,
    CurrencyModule,
    forwardRef(() => ProductReviewModule),
    forwardRef(() => OrderModule),
    forwardRef(() => CategoryModule)
  ],
  controllers: [AdminProductController, ClientProductController],
  providers: [ProductService, OrderedProductService],
  exports: [ProductService]
})
export class ProductModule {}
