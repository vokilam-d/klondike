import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminProductRoutingModule } from './web-admin-product-routing.module';
import { WebAdminProductComponent } from './web-admin-product.component';
import { WebAdminProductService } from '../../shared/services/web-admin-product.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [WebAdminProductComponent],
  imports: [
    CommonModule,
    WebAdminProductRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ],
  providers: [
    WebAdminProductService
  ]
})
export class WebAdminProductModule { }
