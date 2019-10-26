import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminOrdersRoutingModule } from './orders-routing.module';
import { WebAdminOrdersComponent } from './orders.component';


@NgModule({
  declarations: [WebAdminOrdersComponent],
  imports: [
    CommonModule,
    WebAdminOrdersRoutingModule
  ]
})
export class WebAdminOrdersModule { }
