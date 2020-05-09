import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { BlogService } from './blog.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { ClientBlogCategoryListItemDto } from '../shared/dtos/client/blog-category-list-item.dto';
import { ClientBlogCategoryDto } from '../shared/dtos/client/blog-category.dto';
import { ClientBlogPostListItemDto } from '../shared/dtos/client/blog-post-list-item.dto';
import { ClientBlogPostDto } from '../shared/dtos/client/blog-post.dto';
import { plainToClass } from 'class-transformer';
import { ClientSPFDto } from '../shared/dtos/client/spf.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('blog')
export class ClientBlogController {

  constructor(private readonly blogService: BlogService) {
  }

  @Get('categories')
  async getCategoriesList(): Promise<ResponseDto<ClientBlogCategoryListItemDto[]>> {
    const categories = await this.blogService.getAllEnabledCategories();
    const populated = await this.blogService.populateCategoriesWithPostsCount(categories);

    return {
      data: plainToClass(ClientBlogCategoryListItemDto, populated, { excludeExtraneousValues: true })
    };
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string): Promise<ResponseDto<ClientBlogCategoryDto>> {
    const category = await this.blogService.getEnabledCategoryBySlug(slug);

    return {
      data: plainToClass(ClientBlogCategoryDto, category, { excludeExtraneousValues: true })
    };
  }

  @Get('posts')
  async getPostsList(@Query() spf: ClientSPFDto): Promise<ResponseDto<ClientBlogPostListItemDto[]>> {
    const list = spf.lastPosts
      ? await this.blogService.getEnabledLastPostsList(spf)
      : await this.blogService.getEnabledPostsList(spf);

    const itemsTotal = await this.blogService.countPosts({ categoryId: spf.categoryId });

    return {
      data: plainToClass(ClientBlogPostListItemDto, list, { excludeExtraneousValues: true }),
      pagesTotal: Math.ceil(itemsTotal / spf.limit)
    };
  }

  @Get('posts/:slug')
  async getPost(@Param('slug') slug: string): Promise<ResponseDto<ClientBlogPostDto>> {
    const post = await this.blogService.getEnabledPostBySlug(slug);

    return {
      data: plainToClass(ClientBlogPostDto, post, { excludeExtraneousValues: true })
    };
  }
}
