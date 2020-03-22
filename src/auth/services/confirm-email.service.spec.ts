import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmEmailService } from './confirm-email.service';

describe('ConfirmEmailService', () => {
  let service: ConfirmEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfirmEmailService],
    }).compile();

    service = module.get<ConfirmEmailService>(ConfirmEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
