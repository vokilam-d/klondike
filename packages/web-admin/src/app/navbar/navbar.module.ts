import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebAdminNavbarComponent } from './navbar.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [WebAdminNavbarComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    WebAdminNavbarComponent
  ]
})
export class WebAdminNavbarModule { }
