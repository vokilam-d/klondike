import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdminBlogPostCreateOrUpdateDto, AdminBlogPostDto } from '../../shared/dtos/admin/blog-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BlogPost } from '../models/blog-post.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { FastifyRequest } from 'fastify';
import { Media } from '../../shared/models/media.model';
import { MediaService } from '../../shared/services/media/media.service';
import { CounterService } from '../../shared/services/counter/counter.service';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';
import { FilterQuery } from 'mongoose';
import { LinkedBlogCategory } from '../models/linked-blog-category.model';
import { PageRegistryService } from '../../page-registry/page-registry.service';
import { PageTypeEnum } from '../../shared/enums/page-type.enum';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { __ } from '../../shared/helpers/translate/translate.function';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { getCronExpressionEarlyMorning } from '../../shared/helpers/get-cron-expression-early-morning.function';
import { SearchService } from '../../shared/services/search/search.service';
import { ElasticBlogPost } from '../models/elastic-blog-post.model';

@Injectable()
export class BlogPostService {

  private mediaDir = 'blog';
  private logger = new Logger(BlogPostService.name);

  constructor(@InjectModel(BlogPost.name) private readonly blogPostModel: ReturnModelType<typeof BlogPost>,
              private readonly counterService: CounterService,
              private readonly pageRegistryService: PageRegistryService,
              private readonly mediaService: MediaService,
              private readonly searchService: SearchService
  ) { }

  onApplicationBootstrap(): any {
    this.searchService.ensureCollection(BlogPost.collectionName, new ElasticBlogPost());
    // this.reindexAllSearchData();
  }

  async createPost(createDto: AdminBlogPostCreateOrUpdateDto): Promise<BlogPost> {
    const session = await this.blogPostModel.db.startSession();
    session.startTransaction();

    try {
      const created = new this.blogPostModel(createDto);
      created.id = await this.counterService.getCounter(BlogPost.collectionName, session);
      await created.save({ session });
      await this.pageRegistryService.createPageRegistry({ slug: created.slug, type: PageTypeEnum.BlogPost }, session);

      await session.commitTransaction();
      this.addSearchData(created).then();

      return created.toJSON();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async updateBlogPost(blogPostId: string, blogPostDto: AdminBlogPostCreateOrUpdateDto): Promise<DocumentType<BlogPost>> {
    const blogPost = await this.getBlogPost(blogPostId);

    Object.keys(blogPostDto).forEach(key => blogPost[key] = blogPostDto[key]);

    await blogPost.save();
    this.updateSearchData(blogPost);

    return blogPost;
  }

  async deleteBlogPost(blogPostId: string): Promise<DocumentType<BlogPost>> {
    const deleted = await this.blogPostModel.findByIdAndDelete(blogPostId).exec();
    if (!deleted) {
      throw new NotFoundException(__('Blog post with id "$1" not found', 'ru', blogPostId));
    }
    this.deleteSearchData(deleted);

    return deleted;
  }

  uploadMedia(request: FastifyRequest): Promise<Media> {
    return this.mediaService.upload(request, this.mediaDir, false);
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

    const posts = await this.blogPostModel
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

    const posts = await this.blogPostModel
      .find({ isEnabled: true })
      .skip(spf.skip)
      .limit(spf.limit)
      .sort(`-${publishedAtProp}`)
      .exec();

    return posts
      .map(post => post.toJSON())
      .sort(((a, b) => b.sortOrder - a.sortOrder));
  }

  async getBlogPost(id: string): Promise<DocumentType<BlogPost>> {
    const found = await this.blogPostModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Blog post with id "$1" not found', 'ru', id));
    }

    return found;
  }

  async getEnabledPostBySlug(slug: string): Promise<BlogPost> {
    const post = await this.blogPostModel.findOne({ slug, isEnabled: true }).exec();
    if (!post) {
      throw new NotFoundException();
    }

    return post.toJSON();
  }

  async countPosts(filters?: { categoryId: number }): Promise<number> {
    const query: any = { };
    if (filters?.categoryId) {
      const categoryProp: keyof BlogPost = 'category';
      const categoryIdProp: keyof LinkedBlogCategory = 'id';
      query[`${categoryProp}.${categoryIdProp}`] = filters.categoryId;
    }

    return this.blogPostModel.countDocuments(query).exec();
  }

  async getBlogPostsResponseDto(spf: AdminSPFDto): Promise<ResponseDto<AdminBlogPostDto[]>> {
    let blogPosts: AdminBlogPostDto[];
    let itemsFiltered: number;

    if (spf.hasFilters()) {
      const searchResponse = await this.searchByFilters(spf);
      blogPosts = searchResponse[0];
      itemsFiltered = searchResponse[1];
    } else {
      blogPosts = await this.blogPostModel
        .find()
        .sort(spf.getSortAsObj())
        .skip(spf.skip)
        .limit(spf.limit)
        .exec();

      blogPosts = plainToClass(AdminBlogPostDto, blogPosts, { excludeExtraneousValues: true });
    }

    const itemsTotal = await this.countPosts();
    const pagesTotal = Math.ceil((itemsFiltered ?? itemsTotal) / spf.limit);
    return {
      data: blogPosts,
      itemsTotal,
      itemsFiltered,
      pagesTotal
    };
  }

  private async addSearchData(blogPost: BlogPost) {
    const blogPostDto = plainToClass(AdminBlogPostDto, blogPost, { excludeExtraneousValues: true });
    await this.searchService.addDocument(BlogPost.collectionName, blogPost.id, blogPostDto);
  }

  private updateSearchData(blogPost: BlogPost): Promise<any> {
    const blogPostDto = plainToClass(AdminBlogPostDto, blogPost, { excludeExtraneousValues: true });
    return this.searchService.updateDocument(BlogPost.collectionName, blogPost.id, blogPostDto);
  }

  private deleteSearchData(blogPost: BlogPost): Promise<any> {
    return this.searchService.deleteDocument(BlogPost.collectionName, blogPost.id);
  }

  @CronProdPrimaryInstance(getCronExpressionEarlyMorning())
  private async reindexAllSearchData() {
    this.logger.log('Start reindex all search data');
    const blogPosts = await this.blogPostModel.find().sort({ _id: -1 }).exec();

    await this.searchService.deleteCollection(BlogPost.collectionName);
    await this.searchService.ensureCollection(BlogPost.collectionName, new ElasticBlogPost());

    for (const batch of getBatches(blogPosts, 20)) {
      await Promise.all(batch.map(blogPost => this.addSearchData(blogPost)));
      this.logger.log(`Reindexed ids: ${batch.map(i => i.id).join()}`);
    }

    function getBatches<T = any>(arr: T[], size: number = 2): T[][] {
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i % size !== 0) {
          continue;
        }

        const resultItem = [];
        for (let k = 0; (resultItem.length < size && arr[i + k]); k++) {
          resultItem.push(arr[i + k]);
        }
        result.push(resultItem);
      }

      return result;
    }
  }

  private async searchByFilters(spf: AdminSPFDto) {
    return this.searchService.searchByFilters<AdminBlogPostDto>(
      BlogPost.collectionName,
      spf.getNormalizedFilters(),
      spf.skip,
      spf.limit,
      spf.getSortAsObj(),
      undefined,
      new ElasticBlogPost()
    );
  }
}
