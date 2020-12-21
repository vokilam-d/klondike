import { LinkedBlogCategory } from '../../../blog/models/linked-blog-category.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export abstract class BaseLinkedBlogCategoryDto implements LinkedBlogCategory {
  @Expose()
  @IsNumber()
  id: number;

  abstract name: any;

  @Expose()
  @TrimString()
  @IsString()
  slug: string;
}
