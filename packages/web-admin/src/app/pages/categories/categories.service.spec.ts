import { TestBed } from '@angular/core/testing';

import { WebAdminCategoriesService } from './categories.service';

describe('WebAdminCategoriesService', () => {
  let service: WebAdminCategoriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebAdminCategoriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
