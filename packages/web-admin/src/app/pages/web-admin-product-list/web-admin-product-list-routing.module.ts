import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebAdminProductListComponent } from './web-admin-product-list.component';

const routes: Routes = [
  {
    path: '',
    component: WebAdminProductListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminProductListRoutingModule {
}
