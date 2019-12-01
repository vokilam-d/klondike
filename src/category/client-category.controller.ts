import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class ClientCategoryController {
  constructor(private readonly categoryService: CategoryService) {
  }


}
