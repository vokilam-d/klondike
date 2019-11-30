import { Test, TestingModule } from '@nestjs/testing';
import { BackendInventoryController } from './backendInventoryController';

describe('BackendInventory Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [BackendInventoryController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: BackendInventoryController = module.get<BackendInventoryController>(BackendInventoryController);
    expect(controller).toBeDefined();
  });
});
