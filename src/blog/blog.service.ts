import { Injectable, NotFoundException } from '@nestjs/common';
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
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';
import { FilterQuery } from 'mongoose';
import { LinkedBlogCategory } from './models/linked-blog-category.model';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { PageTypeEnum } from '../shared/enums/page-type.enum';

@Injectable()
export class BlogService {

  private mediaDir = 'blog';

  constructor(@InjectModel(BlogPost.name) private readonly postModel: ReturnModelType<typeof BlogPost>,
              @InjectModel(BlogCategory.name) private readonly blogCategoryModel: ReturnModelType<typeof BlogCategory>,
              private readonly counterService: CounterService,
              private readonly pageRegistryService: PageRegistryService,
              private readonly productService: ProductService,
              private readonly mediaService: MediaService) {
  }

  async createBlogCategory(createDto: AdminBlogCategoryCreateDto, migrate?: any): Promise<BlogCategory> {
    const session = await this.blogCategoryModel.db.startSession();
    session.startTransaction();

    try {
      const created = new this.blogCategoryModel(createDto);
      if (!migrate) {
        created.id = await this.counterService.getCounter(BlogCategory.collectionName, session);
      }
      await created.save({ session });
      await this.pageRegistryService.createPageRegistry({ slug: created.slug, type: PageTypeEnum.BlogCategory }, session);

      await session.commitTransaction();
      return created.toJSON();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async createPost(createDto: AdminBlogPostCreateDto, migrate?: any): Promise<BlogPost> {
    const session = await this.postModel.db.startSession();
    session.startTransaction();

    try {
      const created = new this.postModel(createDto);
      if (!migrate) {
        created.id = await this.counterService.getCounter(BlogPost.collectionName, session);
      }
      await created.save({ session });
      await this.pageRegistryService.createPageRegistry({ slug: created.slug, type: PageTypeEnum.BlogPost }, session);

      await session.commitTransaction();
      return created.toJSON();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, this.mediaDir, false);
  }

  async updateCounter() { // todo remove after migrate
    const lastCategory = await this.blogCategoryModel.findOne().sort('-_id').exec();
    await this.counterService.setCounter(BlogCategory.collectionName, lastCategory.id);

    const lastPost = await this.postModel.findOne().sort('-_id').exec();
    await this.counterService.setCounter(BlogPost.collectionName, lastPost.id);
  }

  async migrateLinked() { // todo remove after migrate
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

  async getAllEnabledCategories(): Promise<BlogCategory[]> {
    const categories = await this.blogCategoryModel.find({ isEnabled: true }).exec();

    return categories
      .map(c => c.toJSON())
      .sort(((a, b) => b.sortOrder - a.sortOrder));
  }

  async getEnabledCategoryBySlug(slug: string): Promise<BlogCategory> {
    const category = await this.blogCategoryModel.findOne({ slug, isEnabled: true }).exec();
    if (!category) {
      throw new NotFoundException();
    }

    return category.toJSON();
  }

  async getEnabledPostsList(spf: ClientSPFDto): Promise<BlogPost[]> {
    const query: FilterQuery<BlogPost> = { isEnabled: true };

    if (spf.categoryId) {
      const categoryProp: keyof BlogPost = 'category';
      const categoryIdProp: keyof LinkedBlogCategory = 'id';
      query[`${categoryProp}.${categoryIdProp}`] = spf.categoryId;
    }

    const publishedAtProp: keyof BlogPost = 'publishedAt';
    const sortOrderProp: keyof BlogPost = 'sortOrder';

    const posts = await this.postModel
      .find(query)
      .skip(spf.skip)
      .limit(spf.limit)
      .sort(`-${sortOrderProp} -${publishedAtProp}`)
      .exec();

    return posts
      .map(post => post.toJSON())
      .sort(((a, b) => b.sortOrder - a.sortOrder));
  }

  async getEnabledLastPostsList(spf: ClientSPFDto): Promise<BlogPost[]> {
    const publishedAtProp: keyof BlogPost = 'publishedAt';

    const posts = await this.postModel
      .find({ isEnabled: true })
      .skip(spf.skip)
      .limit(spf.limit)
      .sort(`-${publishedAtProp}`)
      .exec();

    return posts
      .map(post => post.toJSON())
      .sort(((a, b) => b.sortOrder - a.sortOrder));
  }

  async getEnabledPostBySlug(slug: string): Promise<BlogPost> {
    const post = await this.postModel.findOne({ slug, isEnabled: true }).exec();
    if (!post) {
      throw new NotFoundException();
    }

    return post.toJSON();
  }

  async populateCategoriesWithPostsCount(categories: BlogCategory[]): Promise<BlogCategory[] & { postsCount:number }[]> {
    const result = [];

    for (const category of categories) {
      const postsCount = await this.countPosts({ categoryId: category.id });
      result.push({
        ...category,
        postsCount
      });
    }

    return result;
  }

  async countPosts(filters?: { categoryId: number }): Promise<number> {
    const query: any = { };
    if (filters?.categoryId) {
      const categoryProp: keyof BlogPost = 'category';
      const categoryIdProp: keyof LinkedBlogCategory = 'id';
      query[`${categoryProp}.${categoryIdProp}`] = filters.categoryId;
    }

    return this.postModel.countDocuments(query).exec();
  }
}
