import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminDashboardRoutingModule } from './dashboard-routing.module';
import { WebAdminDashboardComponent } from './dashboard.component';


@NgModule({
  declarations: [WebAdminDashboardComponent],
  imports: [
    CommonModule,
    WebAdminDashboardRoutingModule
  ]
})
export class WebAdminDashboardModule { }
