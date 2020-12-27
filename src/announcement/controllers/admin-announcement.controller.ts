import { Body, Controller, Get, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserJwtGuard } from '../../auth/guards/user-jwt.guard';
import { AnnouncementService } from '../services/announcement.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminAnnouncementDto } from '../../shared/dtos/admin/announcement.dto';
import { plainToClass } from 'class-transformer';


@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/announcement')
export class AdminAnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService
  ) { }

  @Get()
  async getAnnouncement(): Promise<ResponseDto<AdminAnnouncementDto>> {
    const announcement = this.announcementService.getAnnouncement();

    return {
      data: plainToClass(AdminAnnouncementDto, announcement, { excludeExtraneousValues: true })
    };
  }

  @Put()
  async updateAnnouncement(@Body() announcementDto: AdminAnnouncementDto): Promise<ResponseDto<AdminAnnouncementDto>> {
    const updated = await this.announcementService.updateAnnouncement(announcementDto);

    return {
      data: plainToClass(AdminAnnouncementDto, updated, { excludeExtraneousValues: true })
    };
  }
}
