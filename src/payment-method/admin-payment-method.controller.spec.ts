import { Test, TestingModule } from '@nestjs/testing';
import { AdminPaymentMethodController } from './admin-payment-method.controller';

describe('PaymentMethod Controller', () => {
  let controller: AdminPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentMethodController],
    }).compile();

    controller = module.get<AdminPaymentMethodController>(AdminPaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
