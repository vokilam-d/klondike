import { Test, TestingModule } from '@nestjs/testing';
import { AttributeController } from './attribute.controller';

describe('Attribute Controller', () => {
  let controller: AttributeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributeController],
    }).compile();

    controller = module.get<AttributeController>(AttributeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
