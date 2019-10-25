import { Test, TestingModule } from '@nestjs/testing';
import { BackendInventoryService } from './backend-inventory.service';

describe('BackendInventoryService', () => {
  let service: BackendInventoryService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendInventoryService],
    }).compile();
    service = module.get<BackendInventoryService>(BackendInventoryService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
