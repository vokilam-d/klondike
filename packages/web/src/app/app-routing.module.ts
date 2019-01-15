import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: './pages/index/index.module#IndexModule'
  }, {
    path: 'category',
    loadChildren: './pages/category/category.module#CategoryModule'
  }, {
    path: 'product',
    loadChildren: './pages/product/product.module#ProductModule'
  }, {
    path: '**',
    loadChildren: './pages/not-found/not-found.module#NotFoundModule'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
