import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { Expose } from 'class-transformer';
import { MetaTags } from '../../shared/models/meta-tags.model';
import { LinkedProduct } from '../../product/models/linked-product.model';
import { LinkedBlogPost } from './linked-blog-post.model';
import { Media } from '../../shared/models/media.model';
import { LinkedBlogCategory } from './linked-blog-category.model';

export class BlogPost {
  @prop()
  _id: number;

  @Expose()
  set id(id: number) { this._id = id; }
  get id(): number { return this._id; }

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  slug: string;

  @prop({ _id: false })
  category: LinkedBlogCategory;

  @prop({ default: true })
  isEnabled: boolean;

  @prop({ default: 0 })
  sortOrder: number;

  @prop({ _id: false })
  metaTags: MetaTags;

  @prop()
  content: string;

  @prop()
  shortContent: string;

  @prop()
  createdAt: Date;

  @prop()
  updatedAt: Date;

  @prop()
  publishedAt: Date;

  @arrayProp({ items: LinkedProduct, _id: false })
  linkedProducts: LinkedProduct[];

  @arrayProp({ items: LinkedBlogPost, _id: false })
  linkedPosts: LinkedBlogPost[];

  @prop()
  featuredMedia: Media;

  @arrayProp({ items: Media })
  medias: Media[];

  static collectionName: string = 'blog-post';
}

export const BlogPostModel = getModelForClass(BlogPost, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
})
