import { Test, TestingModule } from '@nestjs/testing';
import { BackendProductController } from './product.controller';

describe('BackendProduct Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [BackendProductController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: BackendProductController = module.get<BackendProductController>(BackendProductController);
    expect(controller).toBeDefined();
  });
});
