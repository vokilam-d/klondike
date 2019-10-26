import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminCategoriesRoutingModule } from './categories-routing.module';
import { WebAdminCategoriesComponent } from './categories.component';


@NgModule({
  declarations: [WebAdminCategoriesComponent],
  imports: [
    CommonModule,
    WebAdminCategoriesRoutingModule
  ]
})
export class WebAdminCategoriesModule { }
