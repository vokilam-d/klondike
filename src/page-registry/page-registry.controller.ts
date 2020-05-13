import { Controller, Get, Param } from '@nestjs/common';
import { PageRegistryService } from './page-registry.service';

@Controller('pages')
export class PageRegistryController {

  constructor(private readonly pageRegistryService: PageRegistryService) {
  }

  @Get()
  findAll() { // todo add dtos
    return this.pageRegistryService.getAllPages();
  }

  @Get(':slug')
  findPage(@Param('slug') slug: string) {
    return this.pageRegistryService.getPageType(slug);
  }
}
