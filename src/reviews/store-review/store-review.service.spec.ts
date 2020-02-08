import { Test, TestingModule } from '@nestjs/testing';
import { StoreReviewService } from './store-review.service';

describe('StoreReviewService', () => {
  let service: StoreReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreReviewService],
    }).compile();

    service = module.get<StoreReviewService>(StoreReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
