import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/dashboard'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  }, {
    path: 'order',
    loadChildren: () => import('./pages/orders/orders.module').then(m => m.OrdersModule)
  },
  {
    path: 'product',
    loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsModule)
  },
  { path: 'category', loadChildren: () => import('./pages/categories/categories.module').then(m => m.CategoriesModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
