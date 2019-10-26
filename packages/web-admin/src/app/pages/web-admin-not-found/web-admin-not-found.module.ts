import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminNotFoundRoutingModule } from './web-admin-not-found-routing.module';
import { WebAdminNotFoundComponent } from './web-admin-not-found.component';


@NgModule({
  declarations: [WebAdminNotFoundComponent],
  imports: [
    CommonModule,
    WebAdminNotFoundRoutingModule
  ]
})
export class WebAdminNotFoundModule { }
