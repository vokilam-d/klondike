import { Test, TestingModule } from '@nestjs/testing';
import { ShippingMethodController } from './admin-shipping-method.controller';

describe('ShippingMethod Controller', () => {
  let controller: ShippingMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingMethodController],
    }).compile();

    controller = module.get<ShippingMethodController>(ShippingMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
