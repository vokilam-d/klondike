import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category } from './models/category.model';

const categoryModel = {
  name: Category.modelName,
  schema: Category.model.schema,
  collection: Category.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([categoryModel])],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
