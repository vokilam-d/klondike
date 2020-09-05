import { Test, TestingModule } from '@nestjs/testing';
import { OrderedProductService } from './ordered-product.service';

describe('OrderedProductService', () => {
  let service: OrderedProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderedProductService],
    }).compile();

    service = module.get<OrderedProductService>(OrderedProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
