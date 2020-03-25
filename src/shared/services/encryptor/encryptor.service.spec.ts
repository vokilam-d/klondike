import { Test, TestingModule } from '@nestjs/testing';
import { EncryptorService } from './encryptor.service';

describe('EncryptorService', () => {
  let service: EncryptorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptorService],
    }).compile();

    service = module.get<EncryptorService>(EncryptorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
