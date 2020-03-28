import { Test, TestingModule } from '@nestjs/testing';
import { ClientOrderController } from './client-order.controller';

describe('ClientOrder Controller', () => {
  let controller: ClientOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientOrderController],
    }).compile();

    controller = module.get<ClientOrderController>(ClientOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
