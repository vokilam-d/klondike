import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Response, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BlogPostService } from '../services/blog-post.service';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminBlogPostCreateOrUpdateDto, AdminBlogPostDto } from '../../shared/dtos/admin/blog-post.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { ShipmentDto } from '../../shared/dtos/admin/shipment.dto';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/blog/posts')
export class AdminBlogPostController {

  constructor(private readonly blogPostService: BlogPostService) {
  }

  @Get()
  async getBlogPosts(@Query() spf: AdminSPFDto): Promise<ResponseDto<AdminBlogPostDto[]>> {
    return this.blogPostService.getBlogPostsResponseDto(spf);
  }

  @Get(':id')
  async getBlogPost(
    @Param('id') blogPostId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBlogPostDto>> {
    const blogPost = await this.blogPostService.getBlogPost(blogPostId, lang);

    return {
      data: plainToClass(AdminBlogPostDto, blogPost, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async createPost(@Body() createDto: AdminBlogPostCreateOrUpdateDto): Promise<ResponseDto<AdminBlogPostDto>> {
    const created = await this.blogPostService.createPost(createDto);

    return {
      data: plainToClass(AdminBlogPostDto, created, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateBlogPost(
    @Param('id') blogPostId: string,
    @Body() blogPostDto: AdminBlogPostCreateOrUpdateDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBlogPostDto>> {

    const updated = await this.blogPostService.updateBlogPost(blogPostId, blogPostDto, lang);

    return {
      data: plainToClass(AdminBlogPostDto, updated, { excludeExtraneousValues: true })
    };
  }

  @Delete(':id')
  async deleteBlogPost(
    @Param('id') blogPostId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBlogPostDto>> {
    const deleted = await this.blogPostService.deleteBlogPost(blogPostId, lang);

    return {
      data: plainToClass(AdminBlogPostDto, deleted, { excludeExtraneousValues: true })
    };
  }

  /**
   * @returns AdminMediaDto
   */
  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.blogPostService.uploadMedia(request);

    reply.status(201).send(media);
  }
}
