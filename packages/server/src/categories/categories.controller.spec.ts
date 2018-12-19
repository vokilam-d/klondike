import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';

describe('Categories Controller', () => {
  let module: TestingModule;
  
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CategoriesController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CategoriesController = module.get<CategoriesController>(CategoriesController);
    expect(controller).toBeDefined();
  });
});
