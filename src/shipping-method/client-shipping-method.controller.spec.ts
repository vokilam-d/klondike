import { Test, TestingModule } from '@nestjs/testing';
import { ClientShippingMethodController } from './client-shipping-method.controller';

describe('ClientShippingMethod Controller', () => {
  let controller: ClientShippingMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientShippingMethodController],
    }).compile();

    controller = module.get<ClientShippingMethodController>(ClientShippingMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
