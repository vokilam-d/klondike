import { Test, TestingModule } from '@nestjs/testing';
import { BackendProductService } from './backend-product.service';

describe('BackendProductService', () => {
  let service: BackendProductService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendProductService],
    }).compile();
    service = module.get<BackendProductService>(BackendProductService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
