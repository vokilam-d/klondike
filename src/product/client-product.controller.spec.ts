import { Test, TestingModule } from '@nestjs/testing';
import { ClientProductController } from './client-product.controller';

describe('ClientProduct Controller', () => {
  let controller: ClientProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientProductController],
    }).compile();

    controller = module.get<ClientProductController>(ClientProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
