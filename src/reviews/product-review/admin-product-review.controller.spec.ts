import { Test, TestingModule } from '@nestjs/testing';
import { ProductReviewController } from './admin-product-review.controller';

describe('ProductReview Controller', () => {
  let controller: ProductReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductReviewController],
    }).compile();

    controller = module.get<ProductReviewController>(ProductReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
