import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { BackendCategoryService } from './category.service';
import {
  AdminAddOrUpdateCategoryDto,
  AdminCategoriesTreeDto,
  AdminResponseCategoryDto
} from '../shared/dtos/admin/category.dto';
import { plainToClass } from 'class-transformer';

@Controller('admin/categories')
export class BackendAdminCategoryController {
  constructor(private readonly categoryService: BackendCategoryService) {
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('tree')
  async getCategoriesTree(): Promise<AdminCategoriesTreeDto> {
    const tree = await this.categoryService.getCategoriesTree() as any;
    return plainToClass(AdminCategoriesTreeDto, tree, { excludeExtraneousValues: true });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<AdminResponseCategoryDto> {
    const category = await this.categoryService.getCategoryById(id);
    return plainToClass(AdminResponseCategoryDto, category.toJSON(), { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async addCategory(@Body() category: AdminAddOrUpdateCategoryDto): Promise<AdminResponseCategoryDto> {
    const created = await this.categoryService.createCategory(category);
    return plainToClass(AdminResponseCategoryDto, created, { excludeExtraneousValues: true });
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(ClassSerializerInterceptor)
  @Put(':id')
  async updateCategory(@Param('id') id: number, @Body() category: AdminAddOrUpdateCategoryDto): Promise<AdminResponseCategoryDto> {
    const updated = await this.categoryService.updateCategory(id, category);
    return plainToClass(AdminResponseCategoryDto, updated, { excludeExtraneousValues: true });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  async deleteCategory(@Param('id') id: number): Promise<AdminResponseCategoryDto> {
    const deleted = await this.categoryService.deleteCategory(id);
    return plainToClass(AdminResponseCategoryDto, deleted, { excludeExtraneousValues: true });
  }
}
