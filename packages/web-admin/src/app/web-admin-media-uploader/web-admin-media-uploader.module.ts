import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebAdminMediaUploaderComponent } from './web-admin-media-uploader.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [WebAdminMediaUploaderComponent],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [WebAdminMediaUploaderComponent]
})
export class WebAdminMediaUploaderModule { }
