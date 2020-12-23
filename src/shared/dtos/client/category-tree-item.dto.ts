import { BaseCategoryTreeItemDto } from '../shared-dtos/base-category.dto';
import { Expose, Type } from 'class-transformer';
import { Language } from '../../enums/language.enum';
import { AdminCategoryTreeItemDto } from '../admin/category-tree-item.dto';
import { ClientMediaDto } from './media.dto';

export class ClientCategoryTreeItemDto extends BaseCategoryTreeItemDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => ClientCategoryTreeItemDto)
  children: ClientCategoryTreeItemDto[];

  @Expose()
  @Type(() => ClientMediaDto)
  medias: ClientMediaDto[];

  static transformToDto(treeItem: AdminCategoryTreeItemDto, lang: Language): ClientCategoryTreeItemDto {
    return {
      id: treeItem.id,
      isEnabled: treeItem.isEnabled,
      parentId: treeItem.parentId,
      slug: treeItem.slug,
      reversedSortOrder: treeItem.reversedSortOrder,
      medias: treeItem.medias.map(media => ClientMediaDto.transformToDto(media, lang)),
      children: treeItem.children.map(childTreeItem => ClientCategoryTreeItemDto.transformToDto(childTreeItem, lang)),
      name: treeItem.name[lang]
    };
  }
}
