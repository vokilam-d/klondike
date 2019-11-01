import { Module } from '@nestjs/common';
import { BackendCategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendCategory, BackendCategoryModel } from './models/category.model';
import { BackendPageRegistryModule } from '../page-registry/page-registry.module';
import { BackendProductModule } from '../product/product.module';
import { BackendClientCategoryController } from './backend-client-category.controller';
import { BackendAdminCategoryController } from './backend-admin-category.controller';

const categoryModel = {
  name: BackendCategoryModel.modelName,
  schema: BackendCategoryModel.schema,
  collection: BackendCategory.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([categoryModel]),
    BackendPageRegistryModule,
    BackendProductModule
  ],
  controllers: [BackendClientCategoryController, BackendAdminCategoryController],
  providers: [BackendCategoryService]
})
export class BackendCategoryModule {}
