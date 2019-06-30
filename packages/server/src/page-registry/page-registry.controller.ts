import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { PageRegistryService } from './page-registry.service';

@Controller('pages')
export class PageRegistryController {

  constructor(private readonly pageRegistryService: PageRegistryService) {
  }

  @Get(':slug')
  async findPage(@Param(':slug') slug: string) {
    let found;
    try {
      found = await this.pageRegistryService.findPage(slug);
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!found) {
      throw new HttpException(`Page with url ${slug} not found`, HttpStatus.NOT_FOUND);
    }

    return found;
  }
}
