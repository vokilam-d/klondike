import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { dynamicModuleResolver } from './functions/dynamic-module-resolver.function';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./pages/index/index.module').then(m => m.IndexModule)
  },
  {
    matcher: (segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult => {
      const path = segments.reduce((acc, segment) => (acc + (acc ? '/' : '') + segment.path), '');
      route.loadChildren = dynamicModuleResolver(path);
      return {
        consumed: segments
      }
    },
    loadChildren: dynamicModuleResolver(),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
