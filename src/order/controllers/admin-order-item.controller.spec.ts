import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrderItemController } from './admin-order-item.controller';

describe('AdminOrderItem Controller', () => {
  let controller: AdminOrderItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrderItemController],
    }).compile();

    controller = module.get<AdminOrderItemController>(AdminOrderItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
