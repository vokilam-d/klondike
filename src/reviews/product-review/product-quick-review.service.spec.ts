import { Test, TestingModule } from '@nestjs/testing';
import { ProductQuickReviewService } from './product-quick-review.service';

describe('ProductQuickReviewService', () => {
  let service: ProductQuickReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductQuickReviewService],
    }).compile();

    service = module.get<ProductQuickReviewService>(ProductQuickReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
