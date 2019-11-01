import { Controller, Get, Param, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { BackendCategoryService } from './category.service';
import {
  AdminCategoriesTreeDto,
  AdminRequestCategoryDto,
  AdminResponseCategoryDto
} from '../shared/dtos/admin/category.dto';

@Controller('admin/categories')
export class BackendAdminCategoryController {
  constructor(private readonly categoryService: BackendCategoryService) {
  }

  @Get()
  getCategoriesTree(): AdminCategoriesTreeDto {
    return this.categoryService.getCategoriesTree() as any;
  }

  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<AdminResponseCategoryDto> {
    const category = await this.categoryService.getCategory(id);
    return category;
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  async addCategory(@Body() category: AdminRequestCategoryDto) {
    const created = await this.categoryService.createCategory(category);
    return created;
  }
}
