import { Module } from '@nestjs/common';
import { BackendCategoryController } from './category.controller';
import { BackendCategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendCategory } from './models/category.model';
import { BackendPageRegistryModule } from '../page-registry/page-registry.module';
import { BackendProductModule } from '../product/product.module';

const categoryModel = {
  name: BackendCategory.model.modelName,
  schema: BackendCategory.model.schema,
  collection: BackendCategory.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([categoryModel]),
    BackendPageRegistryModule,
    BackendProductModule
  ],
  controllers: [BackendCategoryController],
  providers: [BackendCategoryService]
})
export class BackendCategoryModule {}
