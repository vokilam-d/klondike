import { Test, TestingModule } from '@nestjs/testing';
import { BackendConfigService } from './config.service';

describe('BackendConfigService', () => {
  let service: BackendConfigService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendConfigService],
    }).compile();
    service = module.get<BackendConfigService>(BackendConfigService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
