import { Test, TestingModule } from '@nestjs/testing';
import { BackendCategoryController } from './category.controller';

describe('BackendCategory Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [BackendCategoryController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: BackendCategoryController = module.get<BackendCategoryController>(BackendCategoryController);
    expect(controller).toBeDefined();
  });
});
