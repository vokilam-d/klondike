import { Controller, Headers, Param, Post } from '@nestjs/common';
import { StoreReviewService } from './store-review.service';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ResponseDto } from '../../shared/dtos/admin/response.dto';

@Controller('store-review')
export class ClientStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService) {
  }

  @Post(':id/vote')
  async createVote(@Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    await this.storeReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, headers.customerId);

    return {
      data: true
    }
  }
}
