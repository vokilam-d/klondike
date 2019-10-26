import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WebAdminAppRoutingModule } from './app-routing.module';
import { WebAdminAppComponent } from './app.component';
import { WebAdminNavbarModule } from './navbar/navbar.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    WebAdminAppComponent
  ],
  imports: [
    BrowserModule,
    WebAdminAppRoutingModule,
    WebAdminNavbarModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [WebAdminAppComponent]
})
export class WebAdminAppModule { }
