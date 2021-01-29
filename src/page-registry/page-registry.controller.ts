import { Controller, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { PageRegistryService } from './page-registry.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { PageRegistryDto } from '../shared/dtos/client/page-registry.dto';
import { plainToClass } from 'class-transformer';
import { ClientLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('pages')
export class PageRegistryController {

  constructor(private readonly pageRegistryService: PageRegistryService) {
  }

  @Get()
  async findAll(): Promise<ResponseDto<PageRegistryDto[]>> {
    const pages = await this.pageRegistryService.getAllPages();

    return {
      data: plainToClass(PageRegistryDto, pages, { excludeExtraneousValues: true })
    };
  }

  @Get(':slug')
  findPage(@Param('slug') slug: string, @ClientLang() lang: Language) {
    return this.pageRegistryService.getPageType(slug, lang);
  }
}
