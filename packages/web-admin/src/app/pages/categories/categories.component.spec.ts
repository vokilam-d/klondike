import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminCategoriesComponent } from './categories.component';

describe('WebAdminCategoriesComponent', () => {
  let component: WebAdminCategoriesComponent;
  let fixture: ComponentFixture<WebAdminCategoriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminCategoriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
