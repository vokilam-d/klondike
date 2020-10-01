import { Test, TestingModule } from '@nestjs/testing';
import { FileLogger } from './file-logger.service';

describe('FileLogger', () => {
  let service: FileLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileLogger],
    }).compile();

    service = module.get<FileLogger>(FileLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
