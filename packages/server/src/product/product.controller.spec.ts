import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';

describe('Product Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ProductController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: ProductController = module.get<ProductController>(ProductController);
    expect(controller).toBeDefined();
  });
});
