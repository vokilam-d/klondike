import { Body, Controller, Post, Query, Request, Response, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BlogService } from './blog.service';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { AdminBlogCategoryCreateDto, AdminBlogCategoryDto } from '../shared/dtos/admin/blog-category.dto';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { AdminBlogPostCreateDto, AdminBlogPostDto } from '../shared/dtos/admin/blog-post.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/blog')
export class AdminBlogController {

  constructor(private readonly blogService: BlogService) {
  }

  @Post('categoriesw')
  async createCategory(@Body() createDto: AdminBlogCategoryCreateDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminBlogCategoryDto>> {
    const created = await this.blogService.createBlogCategory(createDto, migrate);

    return {
      data: plainToClass(AdminBlogCategoryDto, created, { excludeExtraneousValues: true })
    }
  }

  @Post('posts')
  async createPost(@Body() createDto: AdminBlogPostCreateDto, @Query('migrate') migrate: any): Promise<ResponseDto<AdminBlogPostDto>> {
    const created = await this.blogService.createPost(createDto, migrate);

    return {
      data: plainToClass(AdminBlogPostDto, created, { excludeExtraneousValues: true })
    }
  }

  /**
   * @returns AdminMediaDto
   */
  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.blogService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post('counter') // todo remove this and all counter updates
  updateCounterCategory() {
    return this.blogService.updateCounter();
  }

  @Post('migrate-linked') // todo remove after migrate this and IMPORT PRODUCT MODULE FROM THIS MODULE
  async migrateLinked() {
    return this.blogService.migrateLinked();
  }
}
