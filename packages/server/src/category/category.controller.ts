import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
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
  async getAll(@Query() queries) {
    try {
      const categories = await this.categoryService.findAll();
      return categories.map(cat => cat.toJSON());
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    let exist;
    try {
      exist = await this.categoryService.findOne({ slug: slug });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!exist) {
      throw new HttpException(`Category with url '${slug}' not found`, HttpStatus.NOT_FOUND);
    }

    return exist.toJSON();
  }

  @Post()
  async addOne(@Body() category: ICategory) {

    if (!category.name) {
      throw new HttpException('Category name is required', HttpStatus.BAD_REQUEST);
    }

    if (!category.slug) {
      category.slug = transliterate(category.name);
    }

    let exist;
    try {
      exist = await this.categoryService.findOne({ slug: category.slug });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (exist) {
      throw new HttpException(`Category with url '${category.slug}' already exists`, HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.categoryService.createCategory(category);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() category: ICategory) {

    const objectId = this.toCategoryObjectId(id);

    let exist;
    try {
      exist = await this.categoryService.findById(objectId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!exist) {
      throw new HttpException(`Category with id '${id}' not found`, HttpStatus.NOT_FOUND);
    }

    try {
      return await this.categoryService.updateCategory(objectId, exist, category);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {

    const objectId = this.toCategoryObjectId(id);

    try {
      return await this.categoryService.deleteCategory(objectId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private toCategoryObjectId(id: string): Types.ObjectId {
    return toObjectId(id, () => { throw new HttpException(`Invalid category ID`, HttpStatus.BAD_REQUEST); });
  }
}
