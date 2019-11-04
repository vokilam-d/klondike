import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminProductListComponent } from './web-admin-product-list.component';

describe('WebAdminProductListComponent', () => {
  let component: WebAdminProductListComponent;
  let fixture: ComponentFixture<WebAdminProductListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminProductListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
