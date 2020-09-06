import { Test, TestingModule } from '@nestjs/testing';
import { AdminAggregatorController } from './admin-aggregator.controller';

describe('AdminAggregator Controller', () => {
  let controller: AdminAggregatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAggregatorController],
    }).compile();

    controller = module.get<AdminAggregatorController>(AdminAggregatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
