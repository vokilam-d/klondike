import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WebAdminNotFoundComponent } from './web-admin-not-found.component';


const routes: Routes = [
  {
    path: '',
    component: WebAdminNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminNotFoundRoutingModule { }
