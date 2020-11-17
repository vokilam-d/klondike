import { Test, TestingModule } from '@nestjs/testing';
import { AdditionalServiceService } from './additional-service.service';

describe('AdditionalServiceService', () => {
  let service: AdditionalServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdditionalServiceService],
    }).compile();

    service = module.get<AdditionalServiceService>(AdditionalServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
