import { BaseLinkedBlogPostDto } from '../shared-dtos/base-linked-blog-post.dto';
import { Expose } from 'class-transformer';
import { LinkedBlogPost } from '../../../blog/models/linked-blog-post.model';
import { Language } from '../../enums/language.enum';

export class ClientLinkedBlogPostDto extends BaseLinkedBlogPostDto {
  @Expose()
  name: string;

  static transformToDto(linkedBlogPost: LinkedBlogPost, lang: Language): ClientLinkedBlogPostDto {
    return {
      id: linkedBlogPost.id,
      name: linkedBlogPost.name[lang],
      slug: linkedBlogPost.slug,
      sortOrder: linkedBlogPost.sortOrder
    };
  }
}
