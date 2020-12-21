import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { BlogPostService } from '../services/blog-post.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientBlogCategoryListItemDto } from '../../shared/dtos/client/blog-category-list-item.dto';
import { ClientBlogCategoryDto } from '../../shared/dtos/client/blog-category.dto';
import { ClientBlogPostListItemDto } from '../../shared/dtos/client/blog-post-list-item.dto';
import { ClientBlogPostDto } from '../../shared/dtos/client/blog-post.dto';
import { ClientSPFDto } from '../../shared/dtos/client/spf.dto';
import { BlogCategoryService } from '../services/blog-category.service';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('blog')
export class ClientBlogController {

  constructor(private readonly blogPostService: BlogPostService,
              private readonly blogCategoryService: BlogCategoryService
  ) { }

  @Get('categories')
  async getCategoriesList(@ClientLang() lang: Language): Promise<ResponseDto<ClientBlogCategoryListItemDto[]>> {
    const categories = await this.blogCategoryService.getAllEnabledCategories();

    return {
      data: await this.blogCategoryService.transformToClientListDto(categories, lang)
    };
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string, @ClientLang() lang: Language): Promise<ResponseDto<ClientBlogCategoryDto>> {
    const category = await this.blogCategoryService.getEnabledCategoryBySlug(slug);

    return {
      data: ClientBlogCategoryDto.transformToDto(category, lang)
    };
  }

  @Get('posts')
  async getPostsList(@Query() spf: ClientSPFDto, @ClientLang() lang: Language): Promise<ResponseDto<ClientBlogPostListItemDto[]>> {
    const list = spf.lastPosts
      ? await this.blogPostService.getEnabledLastPostsList(spf)
      : await this.blogPostService.getEnabledPostsList(spf);

    const itemsTotal = await this.blogPostService.countPosts({ categoryId: spf.categoryId });

    return {
      data: list.map(post => ClientBlogPostListItemDto.transformToDto(post, lang)),
      pagesTotal: Math.ceil(itemsTotal / spf.limit)
    };
  }

  @Get('posts/:slug')
  async getPost(@Param('slug') slug: string, @ClientLang() lang: Language): Promise<ResponseDto<ClientBlogPostDto>> {
    const post = await this.blogPostService.getEnabledPostBySlug(slug);

    return {
      data: ClientBlogPostDto.transformToDto(post, lang)
    };
  }
}
