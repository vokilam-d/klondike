import { ClassSerializerInterceptor, Controller, Get, Param, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ResponseDto } from '../shared/dtos/shared/response.dto';
import { CategoryTreeItem } from '../shared/dtos/shared/category.dto';
import { plainToClass } from 'class-transformer';
import { ClientCategoryDto } from '../shared/dtos/client/category.dto';
import { ClientProductListItemDto } from '../shared/dtos/client/product-list-item.dto';
import { ClientSortingPaginatingFilterDto } from '../shared/dtos/client/spf.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('categories')
export class ClientCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }

  @Get('tree')
  async getCategoriesTree(): Promise<ResponseDto<CategoryTreeItem[]>> {
    const tree = await this.categoryService.getCategoriesTree();
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

  @Get(':slug/items')
  async getCategoryItems(@Param('slug') slug: string,
                         @Query() spf: ClientSortingPaginatingFilterDto
  ): Promise<ResponseDto<ClientProductListItemDto[]>> {

    return this.categoryService.getCategoryItems(slug, spf);
  }
}
