import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminProductsRoutingModule } from './products-routing.module';
import { WebAdminProductsComponent } from './products.component';


@NgModule({
  declarations: [WebAdminProductsComponent],
  imports: [
    CommonModule,
    WebAdminProductsRoutingModule
  ]
})
export class WebAdminProductsModule { }
