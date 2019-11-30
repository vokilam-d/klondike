import { Test, TestingModule } from '@nestjs/testing';
import { BackendCounterService } from './counter.service';

describe('BackendCounterService', () => {
  let service: BackendCounterService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendCounterService],
    }).compile();
    service = module.get<BackendCounterService>(BackendCounterService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
