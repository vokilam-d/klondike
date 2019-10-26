import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminNotFoundComponent } from './web-admin-not-found.component';

describe('WebAdminNotFoundComponent', () => {
  let component: WebAdminNotFoundComponent;
  let fixture: ComponentFixture<WebAdminNotFoundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminNotFoundComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
