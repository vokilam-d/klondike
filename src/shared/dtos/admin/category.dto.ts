import { MetaTagsDto } from './meta-tags.dto';
import { IsBoolean, IsDefined, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';

export class AdminAddOrUpdateCategoryDto {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsString()
  @Transform((slug, category) => slug === '' ? transliterate(category.name) : slug)
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
  @Type(() => AdminCategoryTreeItem)
  children: AdminCategoryTreeItem[];

  constructor(value: Partial<AdminCategoryTreeItem>) {
    Object.assign(this, value);
  }
}
