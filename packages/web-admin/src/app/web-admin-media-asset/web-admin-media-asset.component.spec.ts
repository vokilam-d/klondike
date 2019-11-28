import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminMediaAssetComponent } from './web-admin-media-asset.component';

describe('WebAdminMediaAssetComponent', () => {
  let component: WebAdminMediaAssetComponent;
  let fixture: ComponentFixture<WebAdminMediaAssetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminMediaAssetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminMediaAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
