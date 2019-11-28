import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebAdminProductComponent } from './web-admin-product.component';

const routes: Routes = [{ path: '', component: WebAdminProductComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminProductRoutingModule { }
