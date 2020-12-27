import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Announcement, AnnouncementModel } from '../models/announcement.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAnnouncementDto } from '../../shared/dtos/admin/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name) private readonly announcementModel: ReturnModelType<typeof AnnouncementModel>
  ) { }

  async getAnnouncement(): Promise<DocumentType<Announcement>> {
    return await this.announcementModel.findOne().exec();
  }

  async updateAnnouncement(announcementDto: AdminAnnouncementDto): Promise<DocumentType<Announcement>> {
    const announcement = await this.getAnnouncement();

    Object.keys(announcementDto).forEach(key => announcement[key] = announcementDto[key]);

    await announcement.save();

    return announcement;
  }
}
