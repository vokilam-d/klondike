import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebAdminProductRoutingModule } from './web-admin-product-routing.module';
import { WebAdminProductComponent } from './web-admin-product.component';
import { WebAdminProductService } from '../../shared/services/web-admin-product.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { WebAdminMediaAssetModule } from '../../web-admin-media-asset/web-admin-media-asset.module';
import { WebAdminMediaUploaderModule } from '../../web-admin-media-uploader/web-admin-media-uploader.module';
import { AngularEditorModule } from '@kolkov/angular-editor';


@NgModule({
  declarations: [WebAdminProductComponent],
  imports: [
    CommonModule,
    WebAdminProductRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    WebAdminMediaAssetModule,
    WebAdminMediaUploaderModule,
    AngularEditorModule
  ],
  providers: [
    WebAdminProductService
  ]
})
export class WebAdminProductModule { }
