import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Announcement, AnnouncementModel } from '../models/announcement.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAnnouncementDto } from '../../shared/dtos/admin/announcement.dto';
import { EventsService } from '../../shared/services/events/events.service';

@Injectable()
export class AnnouncementService implements OnApplicationBootstrap {

  private cachedAnnouncement: Announcement = null;
  private announcementUpdatedEventKey: string = 'announcement-updated';

  constructor(
    @InjectModel(Announcement.name) private readonly announcementModel: ReturnModelType<typeof AnnouncementModel>,
    private readonly eventsService: EventsService
  ) { }

  onApplicationBootstrap(): any {
    this.handleCache();
  }

  async getCachedAnnouncement(): Promise<Announcement> {
    if (this.cachedAnnouncement) {
      return this.cachedAnnouncement;
    }

    const announcement = await this.getAnnouncement();
    this.cachedAnnouncement = announcement;
    return announcement;
  }

  async getAnnouncement(): Promise<DocumentType<Announcement>> {
    return await this.announcementModel.findOne().exec();
  }

  async updateAnnouncement(announcementDto: AdminAnnouncementDto): Promise<DocumentType<Announcement>> {
    const announcement = await this.getAnnouncement();

    Object.keys(announcementDto).forEach(key => announcement[key] = announcementDto[key]);

    await announcement.save();
    this.eventsService.emit(this.announcementUpdatedEventKey, {});

    return announcement;
  }

  private async handleCache() {
    this.getCachedAnnouncement();

    this.eventsService.on(this.announcementUpdatedEventKey, () => {
      this.getCachedAnnouncement();
    });
  }
}
