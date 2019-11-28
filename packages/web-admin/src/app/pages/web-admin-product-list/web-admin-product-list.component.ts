import { Component, OnInit } from '@angular/core';
import { WebAdminProductService } from '../../shared/services/web-admin-product.service';
import { AdminResponseProductDto } from '../../../../../backend/src/shared/dtos/admin/product.dto';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'web-admin-product-list',
  templateUrl: './web-admin-product-list.component.html',
  styleUrls: ['./web-admin-product-list.component.scss']
})
export class WebAdminProductListComponent implements OnInit {

  products: AdminResponseProductDto[] = [];

  constructor(private productsService: WebAdminProductService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.fetchProducts();
  }

  add() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }

  private fetchProducts() {
    this.productsService.fetchProducts().subscribe(
      products => {
        this.products = products;
      },
      error => console.warn(error)
    )
  }
}
