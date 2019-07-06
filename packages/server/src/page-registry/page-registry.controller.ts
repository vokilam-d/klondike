import { Controller, Get, Param, Req } from '@nestjs/common';
import { PageRegistryService } from './page-registry.service';

@Controller('pages')
export class PageRegistryController {

  constructor(private readonly pageRegistryService: PageRegistryService) {
  }

  @Get(':slug')
  findPage(@Param('slug') slug: string, @Req() req) {
    return this.pageRegistryService.getPageType(slug);
  }
}
