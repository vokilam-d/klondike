import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isMenuOpened: boolean = false;
  isSearchbarVisible: boolean = false;

  constructor() { }

  ngOnInit() {
  }

  search() {
    console.log('search!');
  }

  openMenu() {
    this.isMenuOpened = true;
  }

  closeMenu() {
    this.isMenuOpened = false;
  }

  showSearchbar() {
    this.isSearchbarVisible = true;
  }

  hideSearchbar() {
    this.isSearchbarVisible = false;
  }
}
