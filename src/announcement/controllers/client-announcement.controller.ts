import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { AnnouncementService } from '../services/announcement.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientAnnouncementDto } from '../../shared/dtos/client/announcement.dto';
import { plainToClass } from 'class-transformer';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('announcement')
export class ClientAnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService
  ) { }

  @Get()
  async getAnnouncement(): Promise<ResponseDto<ClientAnnouncementDto>> {
    const announcement = await this.announcementService.getAnnouncement();
    return {
      data: announcement.isEnabled ? plainToClass(ClientAnnouncementDto, announcement, { excludeExtraneousValues: true }) : null
    }
  }
}
