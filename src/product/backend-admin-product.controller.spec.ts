import { Test, TestingModule } from '@nestjs/testing';
import { BackendAdminProductController } from './backend-admin-product.controller';

describe('BackendAdminProduct Controller', () => {
  let controller: BackendAdminProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendAdminProductController],
    }).compile();

    controller = module.get<BackendAdminProductController>(BackendAdminProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
