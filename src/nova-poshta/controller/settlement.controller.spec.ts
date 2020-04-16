import { Test, TestingModule } from '@nestjs/testing';
import { SettlementController } from './settlementController';

describe('Settlement Controller', () => {
  let controller: SettlementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementController]
    }).compile();

    controller = module.get<SettlementController>(SettlementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
