import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminNavbarComponent } from './navbar.component';

describe('WebAdminNavbarComponent', () => {
  let component: WebAdminNavbarComponent;
  let fixture: ComponentFixture<WebAdminNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminNavbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
