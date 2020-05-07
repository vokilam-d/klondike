import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPost, BlogPostModel } from './models/blog-post.model';
import { AdminBlogController } from './admin-blog.controller';
import { BlogService } from './blog.service';
import { BlogCategory, BlogCategoryModel } from './models/blog-category.model';
import { ProductModule } from '../product/product.module';
import { ClientBlogController } from './client-blog.controller';

const blogPostModel = {
  name: BlogPostModel.modelName,
  schema: BlogPostModel.schema,
  collection: BlogPost.collectionName
}

const blogCategoryModel = {
  name: BlogCategoryModel.modelName,
  schema: BlogCategoryModel.schema,
  collection: BlogCategory.collectionName
}

@Module({
  imports: [
    MongooseModule.forFeature([blogPostModel, blogCategoryModel]),
    ProductModule
  ],
  controllers: [AdminBlogController, ClientBlogController],
  providers: [BlogService]
})
export class BlogModule {
}
