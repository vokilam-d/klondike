import { BlogCategory } from '../../../blog/models/blog-category.model';
import { MetaTagsDto } from '../shared-dtos/meta-tags.dto';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { transliterate } from '../../helpers/transliterate.function';

export class AdminBlogCategoryCreateDto implements Omit<BlogCategory, '_id' | 'id'> {
  id?: any;

  @Expose()
  @IsString()
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
  name: string;

  @Expose()
  @IsString()
  @Transform((slug, category) => slug === '' ? transliterate(category.name) : slug)
  slug: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;
}

export class AdminBlogCategoryDto extends AdminBlogCategoryCreateDto implements Pick<BlogCategory, 'id'> {
  @Expose()
  id: number;
}
