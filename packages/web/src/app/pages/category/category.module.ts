import { NgModule } from '@angular/core';

import { CategoryRoutingModule } from './category-routing.module';
import { CategoryComponent } from './category.component';
import { HeaderModule } from '../../header/header.module';
import { FooterModule } from '../../footer/footer.module';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [CategoryComponent],
  imports: [
    CategoryRoutingModule,
    HeaderModule,
    FooterModule,
    CommonModule
  ]
})
export class CategoryModule { }
