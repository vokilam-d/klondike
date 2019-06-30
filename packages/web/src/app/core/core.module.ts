import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [],
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() private parentModule: CoreModule) {
    if (this.parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only!');
    }
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: []
    }
  }
}
