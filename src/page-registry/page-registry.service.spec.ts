import { Test, TestingModule } from '@nestjs/testing';
import { PageRegistryService } from './page-registry.service';

describe('PageRegistryService', () => {
  let service: PageRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PageRegistryService],
    }).compile();

    service = module.get<PageRegistryService>(PageRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
