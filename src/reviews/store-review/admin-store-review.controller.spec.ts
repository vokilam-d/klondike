import { Test, TestingModule } from '@nestjs/testing';
import { AdminStoreReviewController } from './admin-store-review.controller';

describe('StoreReview Controller', () => {
  let controller: AdminStoreReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminStoreReviewController],
    }).compile();

    controller = module.get<AdminStoreReviewController>(AdminStoreReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
