import { LinkedBlogPost } from '../../../blog/models/linked-blog-post.model';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export abstract class BaseLinkedBlogPostDto implements LinkedBlogPost {
  @Expose()
  @IsNumber()
  id: number;

  abstract name: any;

  @Expose()
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  @IsNumber()
  @IsOptional()
  sortOrder: number;
}
