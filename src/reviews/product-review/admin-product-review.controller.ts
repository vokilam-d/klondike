import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { plainToClass } from 'class-transformer';
import { FastifyRequest } from 'fastify';
import { AdminProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { ProductReviewService } from './product-review.service';
import { AdminProductReviewFilterDto } from '../../shared/dtos/admin/product-review-filter.dto';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { AdminMediaDto } from '../../shared/dtos/admin/media.dto';

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
  async findReview(@Param('id') reviewId: string, @AdminLang() lang: Language): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.findReview(reviewId, lang);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    };
  }

  @Post('media')
  async uploadMedia(@Request() request: FastifyRequest): Promise<AdminMediaDto> {
    const media = await this.productReviewService.uploadMedia(request);

    return plainToClass(AdminMediaDto, media, { excludeExtraneousValues: true });
  }

  @Post()
  async createProductReview(
    @Body() productReviewDto: AdminProductReviewDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.createReview(productReviewDto, lang);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Put(':id')
  async updateProductReview(
    @Param('id') reviewId: string,
    @Body() productReviewDto: AdminProductReviewDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.updateReview(reviewId, productReviewDto, lang);
    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }

  @Delete(':id')
  async deleteProductReview(
    @Param('id') reviewId: string,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminProductReviewDto>> {
    const review = await this.productReviewService.deleteReview(reviewId, lang);

    return {
      data: plainToClass(AdminProductReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
