import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  Response,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminStoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { StoreReviewService } from './store-review.service';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminSPFDto } from '../../shared/dtos/admin/spf.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';

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
  async findReview(@Param('id') reviewId: string): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.findReview(reviewId);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
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
  async createStoreReview(@Body() storeReviewDto: AdminStoreReviewDto): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.createReview(storeReviewDto);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateStoreReview(@Param('id') reviewId: string, @Body() storeReviewDto: AdminStoreReviewDto): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.updateReview(reviewId, storeReviewDto);
    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteStoreReview(@Param('id') reviewId: string): Promise<ResponseDto<AdminStoreReviewDto>> {
    const review = await this.storeReviewService.deleteReview(reviewId);

    return {
      data: plainToClass(AdminStoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
