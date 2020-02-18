import { Test, TestingModule } from '@nestjs/testing';
import { AdminCurrencyController } from './admin-currency.controller';

describe('Currency Controller', () => {
  let controller: AdminCurrencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCurrencyController],
    }).compile();

    controller = module.get<AdminCurrencyController>(AdminCurrencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
