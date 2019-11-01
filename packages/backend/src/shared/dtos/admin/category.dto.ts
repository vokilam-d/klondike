import { MetaTagsDto } from './meta-tags.dto';
import { IsBoolean, IsString, IsDefined, ValidateNested, IsNumber } from 'class-validator';

export class AdminRequestCategoryDto {
  @IsBoolean()
  isEnabled: boolean;

  @IsDefined()
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  slug: string;

  @IsNumber()
  parentId: number;

  @ValidateNested()
  metaTags: MetaTagsDto;
}

export class AdminResponseCategoryDto extends AdminRequestCategoryDto {
  id?: number;
}

class AdminCategoryTreeItem {
  id: AdminResponseCategoryDto['id'];
  name: AdminResponseCategoryDto['name'];
  children: AdminCategoryTreeItem[];
}

export class AdminCategoriesTreeDto {
  categories: AdminCategoryTreeItem[];
}
