import { BlogPost } from '../../../blog/models/blog-post.model';
import { AdminLinkedProductDto } from './linked-product.dto';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { AdminMediaDto } from './media.dto';
import { transliterate } from '../../helpers/transliterate.function';
import { TrimString } from '../../decorators/trim-string.decorator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';
import { clientDefaultLanguage } from '../../constants';
import { AdminMetaTagsDto } from './meta-tags.dto';
import { BaseLinkedBlogCategoryDto } from '../shared-dtos/base-linked-blog-category.dto';
import { BaseLinkedBlogPostDto } from '../shared-dtos/base-linked-blog-post.dto';

export class AdminLinkedBlogCategoryDto extends BaseLinkedBlogCategoryDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;
}

export class AdminLinkedBlogPostDto extends BaseLinkedBlogPostDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;
}

export class AdminBlogPostCreateOrUpdateDto implements Omit<BlogPost, '_id' | 'id'> {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Transform((slug, post: AdminBlogPostCreateOrUpdateDto) => slug === '' ? transliterate(post.name[clientDefaultLanguage]) : slug)
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  @ValidateNested()
  @Type(() => AdminLinkedBlogCategoryDto)
  category: AdminLinkedBlogCategoryDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  content: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  shortContent: MultilingualTextDto;

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsDate()
  @Type(() => Date)
  publishedAt: Date;

  @Expose()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminLinkedBlogPostDto)
  linkedPosts: AdminLinkedBlogPostDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminLinkedProductDto)
  linkedProducts: AdminLinkedProductDto[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @ValidateNested()
  @Type(() => AdminMetaTagsDto)
  metaTags: AdminMetaTagsDto;

  @Expose()
  @IsOptional()
  @IsNumber()
  sortOrder: number;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminMediaDto)
  featuredMedia: AdminMediaDto;
}

export class AdminBlogPostDto extends AdminBlogPostCreateOrUpdateDto implements Pick<BlogPost, 'id'> {
  @Expose()
  id: number;
}

