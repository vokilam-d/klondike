import { Test, TestingModule } from '@nestjs/testing';
import { BackendClientCategoryController } from './backend-client-category.controller';

describe('BackendClientCategory Controller', () => {
  let controller: BackendClientCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendClientCategoryController],
    }).compile();

    controller = module.get<BackendClientCategoryController>(BackendClientCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
