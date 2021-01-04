import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientCategoryDto } from '../shared/dtos/client/category.dto';
import { ClientCategoryTreeItemDto } from '../shared/dtos/client/category-tree-item.dto';
import { ClientLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('categories')
export class ClientCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }

  @Get('tree')
  async getCategoriesTree(@ClientLang() lang: Language): Promise<ResponseDto<ClientCategoryTreeItemDto[]>> {
    const tree = await this.categoryService.getCategoriesTree({ onlyEnabled: true });

    return {
      data: tree.map(treeItem => ClientCategoryTreeItemDto.transformToDto(treeItem, lang))
    };
  }

  @Get(':slug')
  async getCategory(@Param('slug') slug: string, @ClientLang() lang: Language): Promise<ResponseDto<ClientCategoryDto>> {
    return {
      data: await this.categoryService.getClientCategoryBySlug(slug, lang)
    };
  }
}
