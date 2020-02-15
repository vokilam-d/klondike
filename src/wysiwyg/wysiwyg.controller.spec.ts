import { Test, TestingModule } from '@nestjs/testing';
import { WysiwygController } from './wysiwyg.controller';

describe('Wysiwyg Controller', () => {
  let controller: WysiwygController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WysiwygController],
    }).compile();

    controller = module.get<WysiwygController>(WysiwygController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
