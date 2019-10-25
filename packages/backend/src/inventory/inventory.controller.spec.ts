import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';

describe('Inventory Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [InventoryController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: InventoryController = module.get<InventoryController>(InventoryController);
    expect(controller).toBeDefined();
  });
});
