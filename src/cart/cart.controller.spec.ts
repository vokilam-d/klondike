import { Test, TestingModule } from '@nestjs/testing';
import { BackendCartController } from './cart.controller';

describe('BackendCart Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [BackendCartController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: BackendCartController = module.get<BackendCartController>(BackendCartController);
    expect(controller).toBeDefined();
  });
});
