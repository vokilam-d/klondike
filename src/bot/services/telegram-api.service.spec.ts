import { Test, TestingModule } from '@nestjs/testing';
import { TelegramApiService } from './telegram-api.service';

describe('TelegramApiService', () => {
  let service: TelegramApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramApiService],
    }).compile();

    service = module.get<TelegramApiService>(TelegramApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
