import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebAdminDashboardComponent } from './dashboard.component';

const routes: Routes = [{ path: '', component: WebAdminDashboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminDashboardRoutingModule { }
