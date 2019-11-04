import { Module } from '@nestjs/common';
import { BackendProductService } from './backend-product.service';
import { BackendProduct, BackendProductModel } from './models/product.model';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendInventoryModule } from '../inventory/inventory.module';
import { BackendPageRegistryModule } from '../page-registry/page-registry.module';
import { BackendClientProductController } from './backend-client-product.controller';
import { BackendAdminProductController } from './backend-admin-product.controller';

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
  controllers: [BackendAdminProductController, BackendClientProductController],
  providers: [BackendProductService],
  exports: [BackendProductService]
})
export class BackendProductModule {}
