import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category } from './models/category.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.modelName, schema: Category.model.schema }])],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
