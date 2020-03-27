import { Test, TestingModule } from '@nestjs/testing';
import { AdminCustomerController } from './admin-customer.controller';

describe('AdminCustomer Controller', () => {
  let controller: AdminCustomerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCustomerController],
    }).compile();

    controller = module.get<AdminCustomerController>(AdminCustomerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
