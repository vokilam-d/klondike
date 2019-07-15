import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent implements OnInit {

  @Input() isInSidebar: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}
