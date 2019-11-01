import { Controller } from '@nestjs/common';
import { BackendCategoryService } from './category.service';

@Controller('category')
export class BackendClientCategoryController {
  constructor(private readonly categoryService: BackendCategoryService) {
  }


}
