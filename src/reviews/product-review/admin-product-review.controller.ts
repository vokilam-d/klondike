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
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { AdminProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReviewService } from './product-review.service';
import { AdminProductReviewFilterDto } from '../../shared/dtos/admin/product-review-filter.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/product-reviews')
export class AdminProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) {
  }

  @Get()
  async findAllReviews(@Query() spf: AdminProductReviewFilterDto): Promise<ResponseDto<AdminProductReviewDto[]>> {

    if (spf.productId) {

      return {
        data: await this.productReviewService.findReviewsByProductId(spf.productId, false)
      };

    } else {
      return this.productReviewService.findReviewsByFilters(spf);
    }
  }

  @Get(':id')
  async findReview(@Param('id') reviewId: string): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.findReview(reviewId);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productReviewService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post()
  async createProductReview(@Body() productReviewDto: AdminProductReviewDto): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.createReview(productReviewDto);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateProductReview(@Param('id') reviewId: string, @Body() productReviewDto: AdminProductReviewDto): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.updateReview(reviewId, productReviewDto);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteProductReview(@Param('id') reviewId: string): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.deleteReview(reviewId);

    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
