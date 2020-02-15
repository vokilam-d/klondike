import { Test, TestingModule } from '@nestjs/testing';
import { WysiwygService } from './wysiwyg.service';

describe('WysiwygService', () => {
  let service: WysiwygService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WysiwygService],
    }).compile();

    service = module.get<WysiwygService>(WysiwygService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
