import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAdminCategoryComponent } from './web-admin-category.component';

describe('WebAdminCategoryComponent', () => {
  let component: WebAdminCategoryComponent;
  let fixture: ComponentFixture<WebAdminCategoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebAdminCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAdminCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
