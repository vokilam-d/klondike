import { TestBed } from '@angular/core/testing';

import { WebAdminProductService } from './web-admin-product.service';

describe('WebAdminProductService', () => {
  let service: WebAdminProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebAdminProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
