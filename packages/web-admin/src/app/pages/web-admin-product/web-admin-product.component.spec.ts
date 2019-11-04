import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminProductComponent } from './web-admin-product.component';

describe('WebAdminProductComponent', () => {
  let component: WebAdminProductComponent;
  let fixture: ComponentFixture<WebAdminProductComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminProductComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
