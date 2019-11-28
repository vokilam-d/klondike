import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminMediaUploaderComponent } from './web-admin-media-uploader.component';

describe('WebAdminMediaUploaderComponent', () => {
  let component: WebAdminMediaUploaderComponent;
  let fixture: ComponentFixture<WebAdminMediaUploaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminMediaUploaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminMediaUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
