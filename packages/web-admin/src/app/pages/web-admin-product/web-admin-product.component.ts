import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebAdminProductService } from '../../shared/services/web-admin-product.service';
import { EWebAdminPageAction } from '../../shared/enums/category-page-action.enum';
import {
  AdminAddOrUpdateProductDto,
  AdminResponseProductDto
} from '../../../../../backend/src/shared/dtos/admin/product.dto';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

const EMPTY_PRODUCT: AdminAddOrUpdateProductDto = {
  name: '',
  qty: 0,
  price: 0,
  categoryIds: [],
  fullDescription: '',
  isEnabled: true,
  mediaUrls: [],
  metaTags: {
    title: '',
    description: '',
    keywords: '',
  },
  shortDescription: '',
  sku: '',
  slug: ''
};

@Component({
  selector: 'web-admin-product',
  templateUrl: './web-admin-product.component.html',
  styleUrls: ['./web-admin-product.component.scss']
})
export class WebAdminProductComponent implements OnInit {

  isNewProduct: boolean;
  product: AdminResponseProductDto;
  form: FormGroup;

  get isEnabled() { return this.form && this.form.get('isEnabled') as FormControl; }
  get name() { return this.form && this.form.get('name') as FormControl; }
  get sku() { return this.form && this.form.get('sku') as FormControl; }
  get price() { return this.form && this.form.get('price') as FormControl; }
  get qty() { return this.form && this.form.get('qty') as FormControl; }
  get fullDescription() { return this.form && this.form.get('fullDescription') as FormControl; }
  get shortDescription() { return this.form && this.form.get('shortDescription') as FormControl; }
  get slug() { return this.form && this.form.get('slug') as FormControl; }
  get metaTitle() { return this.form && this.form.get('metaTags.title') as FormControl; }
  get metaDescription() { return this.form && this.form.get('metaTags.description') as FormControl; }
  get metaKeywords() { return this.form && this.form.get('metaTags.keywords') as FormControl; }

  constructor(private productsService: WebAdminProductService,
              private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.init();
  }

  goBack() {
    this.router.navigate(['admin', 'product']);
  }

  save() {
    if (this.form.invalid) {
      this.validateAllControls();
      return;
    }

    if (this.isNewProduct) {
      this.addNewProduct();
    } else {
      this.updateProduct();
    }
  }

  private init() {
    this.isNewProduct = this.route.snapshot.data.action === EWebAdminPageAction.Add;
    if (this.isNewProduct) {
      this.buildForm(EMPTY_PRODUCT);
    } else {
      this.getProduct();
    }
  }

  private buildForm(product: AdminAddOrUpdateProductDto) {
    this.form = this.formBuilder.group({
      isEnabled: product.isEnabled,
      name: [product.name, Validators.required],
      slug: product.slug,
      sku: [product.sku, Validators.required],
      price: [product.price, Validators.required],
      qty: product.qty,
      categoryIds: product.categoryIds,
      metaTags: this.formBuilder.group({
        title: product.metaTags.title,
        description: product.metaTags.description,
        keywords: product.metaTags.keywords
      }),
      mediaUrls: product.mediaUrls,
      fullDescription: product.fullDescription,
      shortDescription: product.shortDescription
    });
  }

  private getProduct() {
    const id = this.route.snapshot.paramMap.get('id');
    this.productsService.fetchProduct(id).subscribe(
      product => {
        this.product = product;
        this.buildForm(this.product);
      },
      error => console.warn(error)
    )
  }

  private validateAllControls() {
    Object.keys(this.form.controls).forEach(controlName => {
      const control = this.form.get(controlName);

      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
    });
  }

  isControlInvalid(control: FormControl) {
    return !control.valid && control.touched;
  }

  private addNewProduct() {
    const dto = this.form.value;

    this.productsService.addNewProduct(dto).subscribe(
      product => {
        this.router.navigate(['admin', 'product', 'edit', product.id]);
      },
      error => console.warn(error)
    );
  }

  private updateProduct() {
    const dto = {
      ...this.product,
      ...this.form.value
    };

    this.productsService.updateProduct(this.product.id, dto).subscribe(
      product => {
        this.product = product;
      },
      error => console.warn(error)
    )
  }
}
