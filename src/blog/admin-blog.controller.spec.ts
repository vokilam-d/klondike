import { Test, TestingModule } from '@nestjs/testing';
import { AdminBlogController } from './admin-blog.controller';

describe('Blog Controller', () => {
  let controller: AdminBlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBlogController],
    }).compile();

    controller = module.get<AdminBlogController>(AdminBlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
