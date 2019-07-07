import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { TopMenuComponent } from './top-menu/top-menu.component';

@NgModule({
  declarations: [HeaderComponent, TopMenuComponent],
  imports: [
    CommonModule
  ]
})
export class HeaderModule { }
