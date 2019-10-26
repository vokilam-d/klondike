import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminDashboardComponent } from './dashboard.component';

describe('WebAdminDashboardComponent', () => {
  let component: WebAdminDashboardComponent;
  let fixture: ComponentFixture<WebAdminDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
