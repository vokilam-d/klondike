import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Response,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { AdminAddOrUpdateCategoryDto, AdminCategoryDto } from '../shared/dtos/admin/category.dto';
import { plainToClass } from 'class-transformer';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { ReorderDto } from '../shared/dtos/admin/reorder.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminCategoryTreeItemDto } from '../shared/dtos/admin/category-tree-item.dto';
import { BaseShipmentDto } from '../shared/dtos/shared-dtos/base-shipment.dto';
import { AdminLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }

  @Get()
  async getCategories(): Promise<ResponseDto<AdminCategoryDto[]>> {
    const categories = await this.categoryService.getAllCategories();

    return {
      data: plainToClass(AdminCategoryDto, categories, { excludeExtraneousValues: true })
    }
  }

  @Get('tree')
  async getCategoriesTree(@Query('noClones') noClones: string): Promise<ResponseDto<AdminCategoryTreeItemDto[]>> {
    const tree = await this.categoryService.getCategoriesTree({ onlyEnabled: false, noClones: Boolean(noClones), adminTree: true });
    return {
      data: plainToClass(AdminCategoryTreeItemDto, tree, { excludeExtraneousValues: true })
    };
  }

  @Get(':id')
  async getCategory(
    @Param('id') id: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCategoryDto>> {
    const category = await this.categoryService.getCategoryById(id, lang);
    return {
      data: plainToClass(AdminCategoryDto, category.toJSON(), { excludeExtraneousValues: true })
    };
  }

  @Post()
  async addCategory(@Body() category: AdminAddOrUpdateCategoryDto): Promise<ResponseDto<AdminCategoryDto>> {
    const created = await this.categoryService.createCategory(category);
    return {
      data: plainToClass(AdminCategoryDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.categoryService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post('action/reorder')
  async reorderCategories(
    @Body() reorderDto: ReorderDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCategoryTreeItemDto[]>> {
    const allCategories = await this.categoryService.reoderCategory(reorderDto.id, reorderDto.targetId, reorderDto.position, lang);
    const tree = await this.categoryService.getCategoriesTree({ onlyEnabled: false, adminTree: true, force: true, allCategories });

    return {
      data: plainToClass(AdminCategoryTreeItemDto, tree, { excludeExtraneousValues: true })
    };
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() category: AdminAddOrUpdateCategoryDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCategoryDto>> {
    const updated = await this.categoryService.updateCategory(parseInt(id), category, lang);
    return {
      data: plainToClass(AdminCategoryDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id') id: number,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCategoryDto>> {
    const deleted = await this.categoryService.deleteCategory(id, lang);
    return {
      data: plainToClass(AdminCategoryDto, deleted, { excludeExtraneousValues: true })
    };
  }
}
