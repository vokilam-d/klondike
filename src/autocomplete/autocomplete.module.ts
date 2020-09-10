import { Module } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { AutocompleteController } from './autocomplete.controller';

@Module({
  providers: [AutocompleteService],
  imports: [CategoryModule, ProductModule],
  controllers: [AutocompleteController]
})
export class AutocompleteModule {

}
