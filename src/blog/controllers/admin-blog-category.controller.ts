import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AdminBlogCategoryCreateOrUpdateDto, AdminBlogCategoryDto } from '../../shared/dtos/admin/blog-category.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { BlogCategoryService } from '../services/blog-category.service';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/blog/categories')
export class AdminBlogCategoryController {

  constructor(private readonly blogCategoryService: BlogCategoryService) {
  }

  @Get()
  async getBlogCategorys(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminBlogCategoryDto[]>> {
    return this.blogCategoryService.getBlogCategoriesResponseDto(spf);
  }

  @Get(':id')
  async getBlogCategory(@Param('id') aggregatorId: string): Promise<ResponseDto<AdminBlogCategoryDto>> {
    const aggregator = await this.blogCategoryService.getBlogCategory(aggregatorId);

    return {
      data: plainToClass(AdminBlogCategoryDto, aggregator, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async createCategory(@Body() createDto: AdminBlogCategoryCreateOrUpdateDto): Promise<ResponseDto<AdminBlogCategoryDto>> {
    const created = await this.blogCategoryService.createBlogCategory(createDto);

    return {
      data: plainToClass(AdminBlogCategoryDto, created, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateBlogCategory(
    @Param('id') aggregatorId: string,
    @Body() aggregatorDto: AdminBlogCategoryCreateOrUpdateDto
  ): Promise<ResponseDto<AdminBlogCategoryDto>> {

    const updated = await this.blogCategoryService.updateBlogCategory(aggregatorId, aggregatorDto);

    return {
      data: plainToClass(AdminBlogCategoryDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteBlogCategory(@Param('id') aggregatorId: string): Promise<ResponseDto<AdminBlogCategoryDto>> {
    const deleted = await this.blogCategoryService.deleteBlogCategory(aggregatorId);

    return {
      data: plainToClass(AdminBlogCategoryDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
