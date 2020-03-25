import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { StoreReviewService } from './store-review.service';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';

@Controller('store-reviews')
export class ClientStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService) {
  }

  @Get('count')
  async getCount(): Promise<ResponseDto<number>> {
    const count = await this.storeReviewService.countEnabledReviews();

    return {
      data: count
    }
  }

  @Post(':id/vote')
  async createVote(@Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    await this.storeReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, headers.customerId);

    return {
      data: true
    }
  }
}
