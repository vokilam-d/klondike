import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {

  constructor(private readonly categoryService: CategoryService) {
  }

  @Get()
  getAll() {
    return this.categoryService.findAll();
  }

  @Post()
  async addOne(@Body() category) {
    const cat = await this.categoryService.create(category);
    return cat.toJSON();
  }

  @Delete()
  removeOne(id) {
    return this.categoryService.delete(id);
  }



}
