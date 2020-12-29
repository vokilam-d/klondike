import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnnouncementController } from './admin-announcement.controller';

describe('AdminAnnouncement Controller', () => {
  let controller: AdminAnnouncementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnnouncementController],
    }).compile();

    controller = module.get<AdminAnnouncementController>(AdminAnnouncementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
