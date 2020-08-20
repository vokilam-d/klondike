import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';

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
  breadcrumbs: BreadcrumbDto[];

  @Expose()
  @IsOptional()
  @IsNumber()
  reversedSortOrder: number;

  @Expose()
  @ValidateNested()
  metaTags: MetaTagsDto;
}

export class AdminCategoryDto extends AdminAddOrUpdateCategoryDto {
  @Expose()
  id?: number;
}

