import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EWebAdminPageAction } from './shared/enums/category-page-action.enum';


const routes: Routes = [
  {
    path: 'admin',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/dashboard'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.WebAdminDashboardModule)
      }, {
        path: 'order',
        loadChildren: () => import('./pages/orders/orders.module').then(m => m.WebAdminOrdersModule)
      },
      {
        path: 'category',
        loadChildren: () => import('./pages/categories/categories.module').then(m => m.WebAdminCategoriesModule)
      },
      {
        path: 'product',
        loadChildren: () => import('./pages/web-admin-product-list/web-admin-product-list.module').then(m => m.WebAdminProductListModule)
      },
      {
        path: 'product/add',
        loadChildren: () => import('./pages/web-admin-product/web-admin-product.module').then(m => m.WebAdminProductModule),
        data: {
          action: EWebAdminPageAction.Add
        }
      },
      {
        path: 'product/edit/:id',
        loadChildren: () => import('./pages/web-admin-product/web-admin-product.module').then(m => m.WebAdminProductModule),
        data: {
          action: EWebAdminPageAction.Edit
        }
      },
      {
        path: '**',
        loadChildren: () => import('./pages/web-admin-not-found/web-admin-not-found.module').then(m => m.WebAdminNotFoundModule)
      }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'corrected', scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class WebAdminAppRoutingModule {
}
