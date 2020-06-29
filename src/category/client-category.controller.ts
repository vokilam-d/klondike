import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { CategoryTreeItem } from '../shared/dtos/shared-dtos/category.dto';
import { plainToClass } from 'class-transformer';
import { ClientCategoryDto } from '../shared/dtos/client/category.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('categories')
export class ClientCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }

  @Get('tree')
  async getCategoriesTree(): Promise<ResponseDto<CategoryTreeItem[]>> {
    const tree = await this.categoryService.getCategoriesTree(true);
    return {
      data: plainToClass(CategoryTreeItem, tree, { excludeExtraneousValues: true })
    };
  }

  @Get(':slug')
  async getCategory(@Param('slug') slug: string): Promise<ResponseDto<ClientCategoryDto>> {
    const category = await this.categoryService.getCategoryBySlug(slug);

    return {
      data: plainToClass(ClientCategoryDto, category, { excludeExtraneousValues: true })
    };
  }
}
