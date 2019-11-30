import { Test, TestingModule } from '@nestjs/testing';
import { BackendAdminCategoryController } from './backend-admin-category.controller';

describe('BackendAdminCategory Controller', () => {
  let controller: BackendAdminCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendAdminCategoryController],
    }).compile();

    controller = module.get<BackendAdminCategoryController>(BackendAdminCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
