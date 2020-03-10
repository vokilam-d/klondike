import { Test, TestingModule } from '@nestjs/testing';
import { ClientProductReviewController } from './client-product-review.controller';

describe('ClientProductReview Controller', () => {
  let controller: ClientProductReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientProductReviewController],
    }).compile();

    controller = module.get<ClientProductReviewController>(ClientProductReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
