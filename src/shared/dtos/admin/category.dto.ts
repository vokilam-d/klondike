import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { BreadcrumbDto } from '../shared-dtos/breadcrumb.dto';
import { AdminMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Category } from '../../../category/models/category.model';
import { EProductsSort } from '../../enums/product-sort.enum';

export class AdminAddOrUpdateCategoryDto implements Omit<Record<keyof Category, any>, 'id' | '_id' | 'ancestors' | 'imageUrl'> {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  description: string;

  @Expose()
  @IsString()
  @Transform((slug, category) => slug === '' ? transliterate(category.name) : slug)
  @TrimString()
  slug: string;

  @IsBoolean()
  @IsOptional()
  createRedirect: boolean;

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

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @IsEnum(EProductsSort)
  defaultItemsSort: EProductsSort;
}

export class AdminCategoryDto extends AdminAddOrUpdateCategoryDto {
  @Expose()
  id?: number;
}

