import { BlogCategory } from '../../../blog/models/blog-category.model';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';
import { AdminMetaTagsDto } from './meta-tags.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { clientDefaultLanguage } from '../../constants';

export class AdminBlogCategoryCreateOrUpdateDto implements Omit<BlogCategory, '_id' | 'id'> {
  id?: any;

  @Expose()
  @Type(() => MultilingualTextDto)
  content: MultilingualTextDto;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @ValidateNested()
  @Type(() => AdminMetaTagsDto)
  metaTags: AdminMetaTagsDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @IsString()
  @Transform(
    (slug, category: AdminBlogCategoryCreateOrUpdateDto) => slug === '' ? transliterate(category.name[clientDefaultLanguage]) : slug
  )
  @TrimString()
  slug: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;
}

export class AdminBlogCategoryDto extends AdminBlogCategoryCreateOrUpdateDto implements Pick<BlogCategory, 'id'> {
  @Expose()
  id: number;
}
