import { Test, TestingModule } from '@nestjs/testing';
import { ClientAnnouncementController } from './client-announcement.controller';

describe('ClientAnnouncement Controller', () => {
  let controller: ClientAnnouncementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientAnnouncementController],
    }).compile();

    controller = module.get<ClientAnnouncementController>(ClientAnnouncementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
