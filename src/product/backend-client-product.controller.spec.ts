import { Test, TestingModule } from '@nestjs/testing';
import { BackendClientProductController } from './backend-client-product.controller';

describe('BackendClientProduct Controller', () => {
  let controller: BackendClientProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendClientProductController],
    }).compile();

    controller = module.get<BackendClientProductController>(BackendClientProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
