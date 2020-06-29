import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query, UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AdminAddOrUpdateCategoryDto, AdminResponseCategoryDto } from '../shared/dtos/admin/category.dto';
import { plainToClass } from 'class-transformer';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { CategoryTreeItem } from '../shared/dtos/shared-dtos/category.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { ReorderDto } from '../shared/dtos/admin/reorder.dto';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }

  @Get('tree')
  async getCategoriesTree(): Promise<ResponseDto<CategoryTreeItem[]>> {
    const tree = await this.categoryService.getCategoriesTree(false);
    return {
      data: plainToClass(CategoryTreeItem, tree, { excludeExtraneousValues: true })
    };
  }

  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<ResponseDto<AdminResponseCategoryDto>> {
    const category = await this.categoryService.getCategoryById(id);
    return {
      data: plainToClass(AdminResponseCategoryDto, category.toJSON(), { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addCategory(@Body() category: AdminAddOrUpdateCategoryDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminResponseCategoryDto>> {
    const created = await this.categoryService.createCategory(category, migrate);
    return {
      data: plainToClass(AdminResponseCategoryDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('counter') // todo remove this and all counter updates
  updateCounter() {
    return this.categoryService.updateCounter();
  }

  @Post('clear-collection') // todo remove this and all counter updates
  clearCollection() {
    return this.categoryService.clearCollection();
  }

  @Post('action/reorder')
  async reorderCategories(@Body() reorderDto: ReorderDto): Promise<ResponseDto<CategoryTreeItem[]>> {
    await this.categoryService.reoderCategory(reorderDto.id, reorderDto.targetId, reorderDto.position);
    const tree = await this.categoryService.getCategoriesTree(false);
    return {
      data: plainToClass(CategoryTreeItem, tree, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() category: AdminAddOrUpdateCategoryDto): Promise<ResponseDto<AdminResponseCategoryDto>> {
    const updated = await this.categoryService.updateCategory(parseInt(id), category);
    return {
      data: plainToClass(AdminResponseCategoryDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: number): Promise<ResponseDto<AdminResponseCategoryDto>> {
    const deleted = await this.categoryService.deleteCategory(id);
    return {
      data: plainToClass(AdminResponseCategoryDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
