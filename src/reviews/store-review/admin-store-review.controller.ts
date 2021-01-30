import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Response, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminStoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { StoreReviewService } from './store-review.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ReviewSource } from '../../shared/enums/review-source.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/store-reviews')
export class AdminStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService) {
  }

  @Get()
  async findAllReviews(@Query() sortingPaging: AdminSPFDto): Promise<ResponseDto<AdminStoreReviewDto[]>> {
    return this.storeReviewService.findReviewsByFilters(sortingPaging);
  }

  @Get(':id')
  async findReview(@Param('id') reviewId: string, @AdminLang() lang: Language): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.findReview(reviewId, lang);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.storeReviewService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post()
  async createStoreReview(
    @Body() storeReviewDto: AdminStoreReviewDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminStoreReviewDto>> {
    storeReviewDto.source = ReviewSource.Manager;
    const review = await this.storeReviewService.createReview(storeReviewDto, lang);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateStoreReview(
    @Param('id') reviewId: string,
    @Body() storeReviewDto: AdminStoreReviewDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.updateReview(reviewId, storeReviewDto, lang);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteStoreReview(
    @Param('id') reviewId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.deleteReview(reviewId, lang);

    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
