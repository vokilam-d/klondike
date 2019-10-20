import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ICategory } from '../../../shared/models/category.interface';
import { transliterate } from '../shared/helpers/transliterate.function';
import { toObjectId } from '../shared/object-id.function';
import { Types } from 'mongoose';

@Controller('categories')
export class CategoryController {

  constructor(private readonly categoryService: CategoryService) {
  }

  @Get()
  async getAll(@Query() query) {
    const categories = await this.categoryService.findAll();
    return categories.map(cat => cat.toJSON());
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    const exist = await this.categoryService.getCategory(slug);

    return exist.toJSON();
  }

  @Post()
  async addOne(@Body() category: ICategory) {

    if (!category.name) {
      throw new BadRequestException('Category name is required');
    }

    if (!category.slug) {
      category.slug = transliterate(category.name);
    }

    const exist = await this.categoryService.findOne({ slug: category.slug });

    if (exist) {
      throw new BadRequestException(`Category with url '${category.slug}' already exists`);
    }

    return await this.categoryService.createCategory(category);
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() category: ICategory) {

    const objectId = this.toCategoryObjectId(id);

    const exist = await this.categoryService.findById(objectId);

    if (!exist) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }

    return this.categoryService.updateCategory(objectId, exist, category);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {

    const objectId = this.toCategoryObjectId(id);

    return this.categoryService.deleteCategory(objectId);
  }

  @Get(':id/items')
  async getCategoryItems(@Param('id') id: string, @Query() query) {
    const categoryId = this.toCategoryObjectId(id);

    return this.categoryService.getCategoryItems(categoryId, query);
  }

  private toCategoryObjectId(id: string): Types.ObjectId {
    return toObjectId(id, () => { throw new BadRequestException(`Invalid category ID`); });
  }
}
