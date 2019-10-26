import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminProductsComponent } from './products.component';

describe('WebAdminProductsComponent', () => {
  let component: WebAdminProductsComponent;
  let fixture: ComponentFixture<WebAdminProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
