import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Response, UsePipes, ValidationPipe } from '@nestjs/common';
import { StoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { ResponseDto } from '../../shared/dtos/shared/response.dto';
import { StoreReviewService } from './store-review.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminSortingPaginatingFilterDto } from '../../shared/dtos/admin/spf.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/store-reviews')
export class AdminStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService) {
  }

  @Get()
  async findAllReviews(@Query() sortingPaging: AdminSortingPaginatingFilterDto): Promise<ResponseDto<StoreReviewDto[]>> {
    return this.storeReviewService.getReviewsResponse(sortingPaging);
  }

  @Get(':id')
  async findReview(@Param('id') reviewId: string): Promise<ResponseDto<StoreReviewDto>> {
    const review = await this.storeReviewService.findReview(reviewId);
    return {
      data: plainToClass(StoreReviewDto, review, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.storeReviewService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post('counter') // todo remove this and all counter updates after migrate
  updateCounter() {
    return this.storeReviewService.updateCounter();
  }

  @Post()
  async createStoreReview(@Body() storeReviewDto: StoreReviewDto): Promise<ResponseDto<StoreReviewDto>> {
    const review = await this.storeReviewService.createReview(storeReviewDto);
    return {
      data: plainToClass(StoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateStoreReview(@Param('id') reviewId: string, @Body() storeReviewDto: StoreReviewDto): Promise<ResponseDto<StoreReviewDto>> {
    const review = await this.storeReviewService.updateReview(reviewId, storeReviewDto);
    return {
      data: plainToClass(StoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteStoreReview(@Param('id') reviewId: string): Promise<ResponseDto<StoreReviewDto>> {
    const review = await this.storeReviewService.deleteReview(reviewId);

    return {
      data: plainToClass(StoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
