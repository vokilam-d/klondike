import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


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
        path: 'product',
        loadChildren: () => import('./pages/products/products.module').then(m => m.WebAdminProductsModule)
      },
      {
        path: 'category',
        loadChildren: () => import('./pages/categories/categories.module').then(m => m.WebAdminCategoriesModule)
      },
      {
        path: '**',
        loadChildren: () => import('./pages/web-admin-not-found/web-admin-not-found.module').then(m => m.WebAdminNotFoundModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class WebAdminAppRoutingModule {
}
