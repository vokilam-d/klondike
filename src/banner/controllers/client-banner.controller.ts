import { Controller, Get } from '@nestjs/common';
import { BannerService } from '../services/banner.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';
import { ClientLang } from '../../shared/decorators/lang.decorator';
import { Language } from '../../shared/enums/language.enum';
import { ClientBannerItemDto } from '../../shared/dtos/client/banner-item.dto';

@Controller('banner')
export class ClientBannerController {

  constructor(
    private readonly bannerService: BannerService
  ) { }

  @Get()
  async getBanner(
    @ClientLang() lang: Language
  ): Promise<ResponseDto<ClientBannerItemDto[]>> {
    const banner = await this.bannerService.getBanner(lang);

    return {
      data: banner.map(bannerItem => ClientBannerItemDto.transformToDto(bannerItem, lang))
    };
  }

}
