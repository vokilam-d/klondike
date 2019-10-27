import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WebAdminCategoriesComponent } from './categories.component';
import { WebAdminCategoryComponent } from './web-admin-category/web-admin-category.component';
import { EWebAdminCategoryPageAction } from '../../shared/enums/category-page-action.enum';

const routes: Routes = [
  {
    path: '',
    component: WebAdminCategoriesComponent,
    children: [
      {
        path: 'edit/:id',
        component: WebAdminCategoryComponent,
        data: {
          action: EWebAdminCategoryPageAction.Edit
        }
      },
      {
        path: 'add/parent/:parentId',
        component: WebAdminCategoryComponent,
        data: {
          action: EWebAdminCategoryPageAction.Add
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebAdminCategoriesRoutingModule { }
