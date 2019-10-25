import { Test, TestingModule } from '@nestjs/testing';
import { BackendCategoryService } from './category.service';

describe('BackendCategoryService', () => {
  let service: BackendCategoryService;
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendCategoryService],
    }).compile();
    service = module.get<BackendCategoryService>(BackendCategoryService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
