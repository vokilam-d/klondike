import { ProductCategory } from '../../../product/models/product-category.model';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminProductCategoryDto implements ProductCategory {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @IsOptional()
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;

  @Expose()
  reversedSortOrder: number;

  @Expose()
  isSortOrderFixed: boolean;

  @Expose()
  reversedSortOrderBeforeFix: number;

  @Expose()
  isEnabled: boolean;
}
