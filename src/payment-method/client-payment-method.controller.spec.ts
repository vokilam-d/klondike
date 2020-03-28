import { Test, TestingModule } from '@nestjs/testing';
import { ClientPaymentMethodController } from './client-payment-method.controller';

describe('ClientPaymentMethod Controller', () => {
  let controller: ClientPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientPaymentMethodController],
    }).compile();

    controller = module.get<ClientPaymentMethodController>(ClientPaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
