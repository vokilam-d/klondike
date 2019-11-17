import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminCategorySelectComponent } from './web-admin-category-select.component';

describe('WebAdminCategorySelectComponent', () => {
  let component: WebAdminCategorySelectComponent;
  let fixture: ComponentFixture<WebAdminCategorySelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminCategorySelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminCategorySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
