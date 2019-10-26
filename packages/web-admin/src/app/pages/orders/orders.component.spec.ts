import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminOrdersComponent } from './orders.component';

describe('WebAdminOrdersComponent', () => {
  let component: WebAdminOrdersComponent;
  let fixture: ComponentFixture<WebAdminOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
