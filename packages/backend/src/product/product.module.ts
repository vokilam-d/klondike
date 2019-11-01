import { Module } from '@nestjs/common';
import { BackendProductController } from './product.controller';
import { BackendProductService } from './product.service';
import { BackendProduct, BackendProductModel } from './models/product.model';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendInventoryModule } from '../inventory/inventory.module';
import { BackendPageRegistryModule } from '../page-registry/page-registry.module';

const productModel = {
  name: BackendProductModel.modelName,
  schema: BackendProductModel.schema,
  collection: BackendProduct.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([productModel]),
    BackendInventoryModule,
    BackendPageRegistryModule
  ],
  controllers: [BackendProductController],
  providers: [BackendProductService],
  exports: [BackendProductService]
})
export class BackendProductModule {}
