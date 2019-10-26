import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WebAdminOrdersComponent } from './orders.component';

const routes: Routes = [{ path: '', component: WebAdminOrdersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminOrdersRoutingModule { }
