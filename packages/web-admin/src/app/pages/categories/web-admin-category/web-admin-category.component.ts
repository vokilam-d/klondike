import { Component, OnInit } from '@angular/core';
import { WebAdminCategoriesService } from '../categories.service';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { EWebAdminCategoryPageAction } from '../../../shared/enums/category-page-action.enum';
import { AdminCategoryDto } from '@shared/dtos/admin/category.dto';

const EMPTY_CATEGORY: AdminCategoryDto = {
  id: '',
  isEnabled: true,
  slug: '',
  name: '',
  description: '',
  metaTags: {
    title: '',
    description: '',
    keywords: ''
  }
};

@Component({
  selector: 'web-admin-category',
  templateUrl: './web-admin-category.component.html',
  styleUrls: ['./web-admin-category.component.scss']
})
export class WebAdminCategoryComponent implements OnInit {

  form: FormGroup;

  isNewCategory: boolean = false;

  get isEnabled() { return this.form && this.form.get('isEnabled') as FormControl; }
  get name() { return this.form && this.form.get('name') as FormControl; }
  get description() { return this.form && this.form.get('description') as FormControl; }
  get slug() { return this.form && this.form.get('slug') as FormControl; }
  get metaTitle() { return this.form && this.form.get('metaTags.title') as FormControl; }
  get metaDescription() { return this.form && this.form.get('metaTags.description') as FormControl; }
  get metaKeywords() { return this.form && this.form.get('metaTags.keywords') as FormControl; }

  constructor(private categoriesService: WebAdminCategoriesService,
              private formBuilder: FormBuilder,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.init();
  }

  init() {
    this.isNewCategory = this.route.snapshot.data.action === EWebAdminCategoryPageAction.Add;

    if (this.isNewCategory) {
      this.buildForm(EMPTY_CATEGORY);
    } else {
      this.getCategory();
    }
  }

  buildForm(category: AdminCategoryDto) {
    this.form = this.formBuilder.group({
      isEnabled: category.isEnabled,
      name: [category.name, Validators.required],
      description: category.description,
      slug: category.slug,
      metaTags: this.formBuilder.group({
        title: category.metaTags.title,
        description: category.metaTags.description,
        keywords: category.metaTags.keywords,
      })
    });
  }

  getCategory() {
    const id = this.route.snapshot.paramMap.get('id');

    if (this.categoriesService.activeCategory) {
      return;
    }

    this.categoriesService.fetchCategory(id).subscribe(
      category => {
        this.categoriesService.setActiveCategory(category);
      },
      error => console.warn(error)
    );
  }

  delete() {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    this.categoriesService.deleteCategory(id);
  }

  save() {
    if (this.form.invalid) {
      this.validateAllControls();
      return;
    }

    const parentId = this.route.snapshot.paramMap.get('parentId');
    this.categoriesService.saveCategory(this.form.value, parentId);
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
}
