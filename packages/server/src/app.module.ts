import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { SsrService } from './ssr.service';
import { NotFoundExceptionFilter } from './filters/not-found-exception.filter';

@Module({
  imports: [
    CategoriesModule
  ],
  controllers: [],
  components: [],
  providers: [SsrService, NotFoundExceptionFilter]
})
export class AppModule {}
