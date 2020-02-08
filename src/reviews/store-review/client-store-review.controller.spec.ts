import { Test, TestingModule } from '@nestjs/testing';
import { ClientStoreReviewController } from './client-store-review.controller';

describe('StoreReview Controller', () => {
  let controller: ClientStoreReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientStoreReviewController],
    }).compile();

    controller = module.get<ClientStoreReviewController>(ClientStoreReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
