import { BaseCategoryTreeItemDto } from '../shared-dtos/base-category.dto';
import { Expose, Type } from 'class-transformer';

export class ClientCategoryTreeItemDto extends BaseCategoryTreeItemDto {
  @Expose()
  name: string;
  @Expose()
  @Type(() => ClientCategoryTreeItemDto)
  children: BaseCategoryTreeItemDto[];
}
