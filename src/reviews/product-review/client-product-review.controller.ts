import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { ClientProductReviewFilterDto } from '../../shared/dtos/client/product-review-filter.dto';
import { ResponseDto } from '../../shared/dtos/shared/response.dto';
import { ClientProductReviewDto } from '../../shared/dtos/client/product-review.dto';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { plainToClass } from 'class-transformer';
import { ClientAddProductReviewCommentDto } from '../../shared/dtos/client/product-review-comment.dto';

@Controller('product-reviews')
export class ClientProductReviewController {

  constructor(private readonly productReviewService: ProductReviewService) {
  }

  @Get()
  async findProductReviews(@Query() query: ClientProductReviewFilterDto,
                           @IpAddress() ipAddress: string | null,
                           @Headers() headers
  ): Promise<ResponseDto<ClientProductReviewDto[]>> {

    const adminDto = await this.productReviewService.findReviewsByProductId(query.productId, true, ipAddress, headers.userId, headers.customerId);

    return {
      data: plainToClass(ClientProductReviewDto, adminDto, { excludeExtraneousValues: true })
    }
  }

  @Post(':id/comment')
  async addComment(@Param('id') reviewId: string, @Body() commentDto: ClientAddProductReviewCommentDto, @Headers() headers): Promise<ResponseDto<ClientProductReviewDto>> {
    const review = await this.productReviewService.addComment(parseInt(reviewId), commentDto, headers.customerId);
    const adminDto = this.productReviewService.transformReviewToDto(review, undefined, headers.userId, headers.customerId, true);

    return {
      data: plainToClass(ClientProductReviewDto, adminDto, { excludeExtraneousValues: true })
    }
  }

  @Post(':id/vote')
  async createVote(@Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    await this.productReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, headers.customerId);

    return {
      data: true
    }
  }

  @Post(':id/downvote')
  async removeVote(@Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    await this.productReviewService.removeVote(parseInt(reviewId), ipAddress, headers.userId, headers.customerId);

    return {
      data: true
    }
  }
}
