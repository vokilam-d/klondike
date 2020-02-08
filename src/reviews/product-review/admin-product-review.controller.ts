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
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { AdminSortingPaginatingDto } from '../../shared/dtos/admin/filter.dto';
import { ResponseDto } from '../../shared/dtos/admin/response.dto';
import { plainToClass } from 'class-transformer';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from "http";
import { ProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReviewService } from './product-review.service';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/product-reviews')
export class AdminProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) {
  }

  @Get()
  async findAllReviews(@Query() sortingPaging: AdminSortingPaginatingDto): Promise<ResponseDto<ProductReviewDto[]>> {
    const [ results, itemsTotal ] = await Promise.all([
      this.productReviewService.findAllReviews(sortingPaging),
      this.productReviewService.countReviews()
    ]);
    const pagesTotal = Math.ceil(itemsTotal / sortingPaging.limit);

    return {
      data: plainToClass(ProductReviewDto, results, { excludeExtraneousValues: true }),
      page: sortingPaging.page,
      pagesTotal,
      itemsTotal
    };
  }

  @Get(':id')
  async findReview(@Param('id') reviewId: string): Promise<ResponseDto<ProductReviewDto>> {
    const review = await this.productReviewService.findReview(reviewId);
    return {
      data: plainToClass(ProductReviewDto, review, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest, @Response() reply: FastifyReply<ServerResponse>) {
    const media = await this.productReviewService.uploadMedia(request);

    reply.status(201).send(media);
  }

  @Post()
  async createProductReview(@Body() productReviewDto: ProductReviewDto): Promise<ResponseDto<ProductReviewDto>> {
    const review = await this.productReviewService.createReview(productReviewDto);
    return {
      data: plainToClass(ProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateProductReview(@Param('id') reviewId: string, @Body() productReviewDto: ProductReviewDto): Promise<ResponseDto<ProductReviewDto>> {
    const review = await this.productReviewService.updateReview(reviewId, productReviewDto);
    return {
      data: plainToClass(ProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteProductReview(@Param('id') reviewId: string): Promise<ResponseDto<ProductReviewDto>> {
    const review = await this.productReviewService.deleteReview(reviewId);

    return {
      data: plainToClass(ProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
