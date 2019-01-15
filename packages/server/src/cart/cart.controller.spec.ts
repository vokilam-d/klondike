import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';

describe('Cart Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CartController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CartController = module.get<CartController>(CartController);
    expect(controller).toBeDefined();
  });
});
