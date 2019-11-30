import { Test, TestingModule } from '@nestjs/testing';
import { BackendPageRegistryService } from './page-registry.service';

describe('BackendPageRegistryService', () => {
  let service: BackendPageRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendPageRegistryService],
    }).compile();

    service = module.get<BackendPageRegistryService>(BackendPageRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
