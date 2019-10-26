import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WebAdminCategoriesComponent } from './categories.component';

const routes: Routes = [{ path: '', component: WebAdminCategoriesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminCategoriesRoutingModule { }
