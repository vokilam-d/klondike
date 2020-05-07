import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { BlogService } from './blog.service';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('blog')
export class ClientBlogController {

  constructor(private readonly blogService: BlogService) {
  }


}
