import { MetaTagsDto } from './meta-tags.dto';
import { IsBoolean, IsString, IsDefined, ValidateNested, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class AdminAddOrUpdateCategoryDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsDefined()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsString()
  slug: string;

  @Expose()
  @IsNumber()
  parentId: number;

  @Expose()
  @ValidateNested()
  metaTags: MetaTagsDto;
}

export class AdminResponseCategoryDto extends AdminAddOrUpdateCategoryDto {
  @Expose()
  id?: number;
}

export class AdminCategoryTreeItem {
  @Expose()
  id: AdminResponseCategoryDto['id'];
  @Expose()
  name: AdminResponseCategoryDto['name'];
  @Expose()
  children: AdminCategoryTreeItem[];

  constructor(value: Partial<AdminCategoryTreeItem>) {
    Object.assign(this, value);
  }
}

export class AdminCategoriesTreeDto {
  @Expose()
  categories: AdminCategoryTreeItem[];

  constructor(value: Partial<AdminCategoriesTreeDto>) {
    Object.assign(this, value);
  }
}
