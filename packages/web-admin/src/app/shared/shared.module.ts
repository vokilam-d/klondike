import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebAdminCategorySelectComponent } from './components/category-select/web-admin-category-select.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WebAdminClickOutsideDirective } from './directives/click-outside/web-admin-click-outside.directive';


@NgModule({
  declarations: [WebAdminCategorySelectComponent, WebAdminClickOutsideDirective],
  exports: [
    WebAdminCategorySelectComponent,
    WebAdminClickOutsideDirective
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class SharedModule {
}
