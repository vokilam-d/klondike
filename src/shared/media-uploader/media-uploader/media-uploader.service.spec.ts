import { Test, TestingModule } from '@nestjs/testing';
import { BackendMediaService } from './backend-media.service';

describe('MediaUploaderService', () => {
  let service: BackendMediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackendMediaService],
    }).compile();

    service = module.get<BackendMediaService>(BackendMediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
