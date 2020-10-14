import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPost, BlogPostModel } from './models/blog-post.model';
import { AdminBlogPostController } from './controllers/admin-blog-post.controller';
import { BlogPostService } from './services/blog-post.service';
import { BlogCategory, BlogCategoryModel } from './models/blog-category.model';
import { ClientBlogController } from './controllers/client-blog.controller';
import { PageRegistryModule } from '../page-registry/page-registry.module';
import { AdminBlogCategoryController } from './controllers/admin-blog-category.controller';
import { BlogCategoryService } from './services/blog-category.service';

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
    PageRegistryModule
  ],
  controllers: [AdminBlogPostController, AdminBlogCategoryController, ClientBlogController],
  providers: [BlogPostService, BlogCategoryService]
})
export class BlogModule {
}
