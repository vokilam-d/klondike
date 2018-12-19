import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('api/categories')
export class CategoriesController {

  constructor(private readonly categoriesService: CategoriesService) {
  }

  @Get()
  getTest() {
    return this.categoriesService.getTest();
  }

}
