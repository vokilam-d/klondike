import { Test, TestingModule } from '@nestjs/testing';
import { AdminAttributeController } from './admin-attribute.controller';

describe('Attribute Controller', () => {
  let controller: AdminAttributeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAttributeController],
    }).compile();

    controller = module.get<AdminAttributeController>(AdminAttributeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
