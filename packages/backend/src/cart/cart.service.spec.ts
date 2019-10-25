import { Test, TestingModule } from '@nestjs/testing';
import { BackendCartService } from './cart.service';

describe('BackendCartService', () => {
  let service: BackendCartService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendCartService],
    }).compile();
    service = module.get<BackendCartService>(BackendCartService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
