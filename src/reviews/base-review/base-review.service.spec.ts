import { Test, TestingModule } from '@nestjs/testing';
import { BaseReviewService } from './base-review.service';

describe('BaseReviewService', () => {
  let service: BaseReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaseReviewService],
    }).compile();

    service = module.get<BaseReviewService>(BaseReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
