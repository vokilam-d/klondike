import { Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { StoreReviewService } from './store-review.service';
import { IpAddress } from '../../shared/decorators/ip-address.decorator';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AuthService } from '../../auth/services/auth.service';
import { ProductReviewService } from '../product-review/product-review.service';
import { ModuleRef } from '@nestjs/core';

@Controller('store-reviews')
export class ClientStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService,
              private moduleRef: ModuleRef) {
  }

  @Get('count')
  async getCount(): Promise<ResponseDto<number>> {
    const count = await this.storeReviewService.countEnabledReviews();

    return {
      data: count
    }
  }

  @Post(':id/vote')
  async createVote(@Req() req, @Param('id') reviewId: string, @IpAddress() ipAddress: string | null, @Headers() headers): Promise<ResponseDto<boolean>> {
    const authService = this.moduleRef.get(AuthService, { strict: false });
    const customerId = await authService.getCustomerIdFromReq(req);
    await this.storeReviewService.createVote(parseInt(reviewId), ipAddress, headers.userId, customerId);

    return {
      data: true
    }
  }
}
