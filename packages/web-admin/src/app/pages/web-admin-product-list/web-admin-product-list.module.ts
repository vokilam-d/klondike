import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminProductListRoutingModule } from './web-admin-product-list-routing.module';
import { WebAdminProductListComponent } from './web-admin-product-list.component';
import { WebAdminProductService } from '../../shared/services/web-admin-product.service';


@NgModule({
  declarations: [WebAdminProductListComponent],
  imports: [
    CommonModule,
    WebAdminProductListRoutingModule
  ],
  providers: [
    WebAdminProductService
  ]
})
export class WebAdminProductListModule { }
