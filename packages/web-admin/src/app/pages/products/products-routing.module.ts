import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebAdminProductsComponent } from './products.component';

const routes: Routes = [{ path: '', component: WebAdminProductsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminProductsRoutingModule { }
