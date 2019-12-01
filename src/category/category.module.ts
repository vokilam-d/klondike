import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategoryModel } from './models/category.model';
import { PageRegistryModule } from '../page-registry/page-registry.module';
import { ProductModule } from '../product/product.module';
import { ClientCategoryController } from './client-category.controller';
import { AdminCategoryController } from './admin-category.controller';

const categoryModel = {
  name: CategoryModel.modelName,
  schema: CategoryModel.schema,
  collection: Category.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([categoryModel]),
    PageRegistryModule,
    ProductModule
  ],
  controllers: [ClientCategoryController, AdminCategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
