import { Controller } from '@nestjs/common';
import { BackendCategoryService } from './backend-category.service';

@Controller('category')
export class BackendClientCategoryController {
  constructor(private readonly categoryService: BackendCategoryService) {
  }


}
