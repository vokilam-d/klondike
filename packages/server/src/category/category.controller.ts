import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ICategory } from '../../../shared/models/category.interface';
import { transliterate } from '../shared/helpers/transliterate.function';
import { toObjectId } from '../shared/object-id.function';

@Controller('categories')
export class CategoryController {

  constructor(private readonly categoryService: CategoryService) {
  }

  @Get()
  async getAll(@Query() queries) {
    const categories = await this.categoryService.findAll();
    return categories.map(cat => cat.toJSON());
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    const category = await this.categoryService.findOne({ slug: slug });
    return category.toJSON();
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
      exist = await this.categoryService.findOne({ url: category.slug });
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (exist) {
      throw new HttpException(`Category with url ${category.name} already exists`, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.categoryService.createCategory(category);
      return result;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async updateOne(@Param('id') id: string, @Body() category: ICategory) {

    const objectId = toObjectId(id, () => { throw new HttpException(`Invalid category ID`, HttpStatus.BAD_REQUEST); });

    let exist;
    try {
      exist = await this.categoryService.findById(objectId);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!exist) {
      throw new HttpException(`Category '${id}' not found`, HttpStatus.NOT_FOUND);
    }

    Object.keys(category).forEach(key => {
      exist[key] = category[key];
    });

    try {
      const updated = await this.categoryService.update(objectId, exist);
      return updated.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {

    const objectId = toObjectId(id, () => { throw new HttpException(`Invalid category ID`, HttpStatus.BAD_REQUEST); });

    try {
      const deleted = await this.categoryService.delete({ '_id': objectId });
      return deleted.toJSON();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
