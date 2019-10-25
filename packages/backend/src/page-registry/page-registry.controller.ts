import { Controller, Get, Param, Req } from '@nestjs/common';
import { BackendPageRegistryService } from './page-registry.service';

@Controller('pages')
export class BackendPageRegistryController {

  constructor(private readonly pageRegistryService: BackendPageRegistryService) {
  }

  @Get()
  findAll(@Req() req) {
    return this.pageRegistryService.getAllPages();
  }

  @Get(':slug')
  findPage(@Param('slug') slug: string, @Req() req) {
    return this.pageRegistryService.getPageType(slug);
  }
}
