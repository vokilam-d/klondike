import { BlogCategory } from '../../../blog/models/blog-category.model';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminBlogCategoryCreateOrUpdateDto implements Omit<BlogCategory, '_id' | 'id'> {
  id?: any;

  @Expose()
  @IsString()
  @TrimString()
  content: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @ValidateNested()
  @Type(() => MetaTagsDto)
  metaTags: MetaTagsDto;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @Transform((slug, category) => slug === '' ? transliterate(category.name) : slug)
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
