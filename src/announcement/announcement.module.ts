import { Module } from '@nestjs/common';
import { AdminAnnouncementController } from './controllers/admin-announcement.controller';
import { ClientAnnouncementController } from './controllers/client-announcement.controller';
import { AnnouncementService } from './services/announcement.service';
import { Announcement, AnnouncementModel } from './models/announcement.model';
import { MongooseModule } from '@nestjs/mongoose';


const announcementModel = {
  name: AnnouncementModel.modelName,
  schema: AnnouncementModel.schema,
  collection: Announcement.collectionName
};


@Module({
  imports: [
    MongooseModule.forFeature([announcementModel])
  ],
  controllers: [AdminAnnouncementController, ClientAnnouncementController],
  providers: [AnnouncementService]
})
export class AnnouncementModule {}
