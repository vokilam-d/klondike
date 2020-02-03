import { Body, Controller, Post } from '@nestjs/common';
import { AddOrUpdateStoreReviewDto, StoreReviewDto } from '../shared/dtos/admin/store-review.dto';
import { ResponseDto } from '../shared/dtos/admin/response.dto';
import { StoreReviewService } from './store-review.service';
import { plainToClass } from 'class-transformer';

@Controller('admin/store-reviews')
export class AdminStoreReviewController {

  constructor(private readonly storeReviewService: StoreReviewService) {
  }

  @Post()
  async createStoreReview(@Body() storeReviewDto: AddOrUpdateStoreReviewDto): Promise<ResponseDto<StoreReviewDto>> {
    const review = await this.storeReviewService.createStoreReview(storeReviewDto);

    return {
      data: plainToClass(StoreReviewDto, review, { excludeExtraneousValues: true })
    }
  }
}
