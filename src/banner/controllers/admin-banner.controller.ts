import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdminLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { AdminCreateBannerItemDto } from '../../shared/dtos/admin/create-banner-item.dto';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { AdminBannerItemDto } from '../../shared/dtos/admin/banner-item.dto';
import { BannerService } from '../services/banner.service';
import { EBannerItemType } from '../../shared/enums/banner-item-type.enum';
import { plainToClass } from 'class-transformer';
import { AdminUpdateBannerDto } from '../../shared/dtos/admin/update-banner.dto';

@Controller('admin/banner')
export class AdminBannerController {

  constructor(
    private readonly bannerService: BannerService
  ) { }

  @Get()
  async getBanner(
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBannerItemDto[]>> {
    const banner = await this.bannerService.getBanner(lang);

    return {
      data: plainToClass(AdminBannerItemDto, banner, { excludeExtraneousValues: true })
    };
  }

  @Post('banner-item')
  async createBannerItem(
    @Body() createBannerItemDto: AdminCreateBannerItemDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBannerItemDto>> {
    const created = await this.bannerService.createBannerItem(createBannerItemDto, lang);

    return {
      data: plainToClass(AdminBannerItemDto, created, { excludeExtraneousValues: true })
    };
  }

  @Post()
  async updateBanner(
    @Body() updateBannerDto: AdminUpdateBannerDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminBannerItemDto[]>> {
    const updated = await this.bannerService.updateBanner(updateBannerDto, lang);

    return {
      data: plainToClass(AdminBannerItemDto, updated, { excludeExtraneousValues: true })
    };
  }
}
