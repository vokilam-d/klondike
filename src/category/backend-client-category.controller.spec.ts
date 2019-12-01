import { Test, TestingModule } from '@nestjs/testing';
import { ClientCategoryController } from './client-category.controller';

describe('ClientCategory Controller', () => {
  let controller: ClientCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientCategoryController],
    }).compile();

    controller = module.get<ClientCategoryController>(ClientCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
