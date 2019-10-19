import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryRoutingModule } from './category-routing.module';
import { CategoryComponent } from './category.component';
import { HeaderModule } from '../../header/header.module';
import { FooterModule } from '../../footer/footer.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [CategoryComponent],
  imports: [
    CommonModule,
    CategoryRoutingModule,
    HeaderModule,
    FooterModule,
    HttpClientModule
  ]
})
export class CategoryModule { }
