import { Injectable } from '@nestjs/common';
import { AdminBlogCategoryCreateDto } from '../shared/dtos/admin/blog-category.dto';
import { AdminBlogPostCreateDto } from '../shared/dtos/admin/blog-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlogPost } from './models/blog-post.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { BlogCategory } from './models/blog-category.model';
import { FastifyRequest } from 'fastify';
import { Media } from '../shared/models/media.model';
import { MediaService } from '../shared/services/media/media.service';
import { CounterService } from '../shared/services/counter/counter.service';
import { ProductService } from '../product/product.service';
import { AdminSPFDto } from '../shared/dtos/admin/spf.dto';

@Injectable()
export class BlogService {

  private mediaDir = 'blog';

  constructor(@InjectModel(BlogPost.name) private readonly postModel: ReturnModelType<typeof BlogPost>,
              @InjectModel(BlogCategory.name) private readonly blogCategoryModel: ReturnModelType<typeof BlogCategory>,
              private readonly counterService: CounterService,
              private readonly productService: ProductService,
              private readonly mediaService: MediaService) {
  }

  async createBlogCategory(createDto: AdminBlogCategoryCreateDto, migrate?: any): Promise<BlogCategory> {
    const created = new this.blogCategoryModel(createDto);
    if (!migrate) {
      created.id = await this.counterService.getCounter(BlogCategory.collectionName);
    }
    await created.save();
    return created.toJSON();
  }

  async createPost(createDto: AdminBlogPostCreateDto, migrate?: any): Promise<BlogPost> {
    const created = new this.postModel(createDto);
    if (!migrate) {
      created.id = await this.counterService.getCounter(BlogPost.collectionName);
    }
    await created.save();
    return created.toJSON();
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, this.mediaDir, false);
  }

  async updateCounter() {
    const lastCategory = await this.blogCategoryModel.findOne().sort('-_id').exec();
    await this.counterService.setCounter(BlogCategory.collectionName, lastCategory.id);

    const lastPost = await this.postModel.findOne().sort('-_id').exec();
    await this.counterService.setCounter(BlogPost.collectionName, lastPost.id);
  }

  async migrateLinked() {
    const spf = new AdminSPFDto();
    spf.limit = 10000;
    const allProducts = await this.productService.getProductsWithQty(spf);
    const posts = await this.postModel.find({ $or: [{ linkedPosts: { $exists: true, $ne: [] } }, { linkedProducts: { $exists: true, $ne: [] } }] });

    for (const post of posts) {
      const linkedProductsToRemove = [];
      for (const linkedProduct of post.linkedProducts) {
        const product = allProducts.find(p => p._id === linkedProduct.productId);
        if (!product) {
          linkedProductsToRemove.push(product);
          continue;
        }
        linkedProduct.variantId = product.variants[0]._id.toString();
      }
      linkedProductsToRemove.forEach(p => {
        const idx = post.linkedProducts.indexOf(p);
        post.linkedProducts.splice(idx, 1);
      });

      const linkedPostsToRemove = [];
      for (const linkedPost of post.linkedPosts) {
        const foundPost = posts.find(p => p._id === linkedPost.id);
        if (!foundPost) {
          linkedPostsToRemove.push(linkedPost);
          continue;
        }
        linkedPost.name = foundPost.name;
        linkedPost.slug = foundPost.slug;
      }
      linkedPostsToRemove.forEach(p => {
        const idx = post.linkedProducts.indexOf(p);
        post.linkedProducts.splice(idx, 1);
      });

      await post.save();
    }
  }
}
