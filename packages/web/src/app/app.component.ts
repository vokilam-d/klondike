import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'web';

  resp: any;

  constructor(private appService: AppService) {
  }

  ngOnInit() {
    console.log('init app!');
    this.getTest();
  }

  getTest() {
    this.appService.getTest().subscribe(
      resp => {
        this.resp = resp;
      },
      err => console.log('err', err)
    );
  }


}
