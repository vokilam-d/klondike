import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';
import { AdminMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Category } from '../../../category/models/category.model';
import { EProductsSort } from '../../enums/product-sort.enum';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { ClientMetaTagsDto } from '../client/meta-tags.dto';
import { clientDefaultLanguage } from '../../constants';

export class AdminAddOrUpdateCategoryDto implements Omit<Record<keyof Category, any>, 'id' | '_id' | 'imageUrl'> {
  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  description: MultilingualTextDto;

  @Expose()
  @IsString()
  @Transform((slug, category: AdminAddOrUpdateCategoryDto) => transliterate(slug || category.name[clientDefaultLanguage]))
  @TrimString()
  slug: string;

  @IsBoolean()
  @IsOptional()
  createRedirect: boolean;

  @Expose()
  @IsNumber()
  parentId: number;

  @Expose()
  breadcrumbCategoryIds: number[];

  @Expose()
  @IsOptional()
  @IsNumber()
  reversedSortOrder: number;

  @Expose()
  @ValidateNested()
  metaTags: ClientMetaTagsDto;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @IsEnum(EProductsSort)
  defaultItemsSort: EProductsSort;

  @Expose()
  @IsOptional()
  @IsNumber()
  canonicalCategoryId: number;
}

export class AdminCategoryDto extends AdminAddOrUpdateCategoryDto {
  @Expose()
  id?: number;
}
