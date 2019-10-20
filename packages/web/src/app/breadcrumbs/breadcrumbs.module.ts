import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { CategoryRoutingModule } from '../pages/category/category-routing.module';



@NgModule({
  declarations: [BreadcrumbsComponent],
  imports: [
    CommonModule,
    CategoryRoutingModule
  ],
  exports: [
    BreadcrumbsComponent
  ]
})
export class BreadcrumbsModule { }
