import { Test, TestingModule } from '@nestjs/testing';
import { ClientAggregatorController } from './client-aggregator.controller';

describe('ClientAggregator Controller', () => {
  let controller: ClientAggregatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientAggregatorController],
    }).compile();

    controller = module.get<ClientAggregatorController>(ClientAggregatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
