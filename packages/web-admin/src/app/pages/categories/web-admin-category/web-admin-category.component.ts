import { Component, OnInit } from '@angular/core';
import { WebAdminCategoriesService } from '../categories.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { EWebAdminPageAction } from '../../../shared/enums/category-page-action.enum';
import {
  AdminAddOrUpdateCategoryDto,
  AdminResponseCategoryDto
} from '../../../../../../backend/src/shared/dtos/admin/category.dto';
import { AngularEditorConfig } from '@kolkov/angular-editor';

const EMPTY_CATEGORY: AdminAddOrUpdateCategoryDto = {
  isEnabled: true,
  slug: '',
  name: '',
  description: '',
  parentId: 0,
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

  category: AdminResponseCategoryDto;

  form: FormGroup;

  get isEnabled() { return this.form && this.form.get('isEnabled') as FormControl; }
  get name() { return this.form && this.form.get('name') as FormControl; }
  get description() { return this.form && this.form.get('description') as FormControl; }
  get slug() { return this.form && this.form.get('slug') as FormControl; }
  get metaTitle() { return this.form && this.form.get('metaTags.title') as FormControl; }
  get metaDescription() { return this.form && this.form.get('metaTags.description') as FormControl; }
  get metaKeywords() { return this.form && this.form.get('metaTags.keywords') as FormControl; }

  get isNewCategory(): boolean { return this.route.snapshot.data.action === EWebAdminPageAction.Add; }

  editorConfig: AngularEditorConfig = {
    editable: true,
    minHeight: '5rem',
    outline: false
  };

  constructor(private categoriesService: WebAdminCategoriesService,
              private formBuilder: FormBuilder,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(_ => {
      this.init();
    });
  }

  init() {
    this.category = null;

    if (this.isNewCategory) {
      this.buildForm(EMPTY_CATEGORY);
    } else {
      this.getCategory();
    }
  }

  getCategory() {
    const id = this.route.snapshot.paramMap.get('id');

    this.categoriesService.fetchCategory(id).subscribe(
      category => {
        this.category = category;
        this.categoriesService.setSelectedCategoryId(category.id);
        this.buildForm(this.category);
      },
      error => console.warn(error)
    );
  }

  save() {
    if (this.form.invalid) {
      this.validateAllControls();
      return;
    }

    if (this.isNewCategory) {
      this.addNewCategory();
    } else {
      this.updateCategory();
    }
  }

  delete() {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }

    this.categoriesService.deleteCategory(this.category.id).subscribe(
      _ => {
        this.router.navigate(['admin', 'category']);
        this.categoriesService.categoryUpdated$.next();
      },
      error => console.warn(error)
    );
  }

  private addNewCategory() {
    const parentId = this.route.snapshot.paramMap.get('parentId');

    this.categoriesService.saveCategory(this.form.value, parentId).subscribe(
      category => {
        this.categoriesService.categoryUpdated$.next();
        this.router.navigate(['admin', 'category', 'edit', category.id]);
      },
      error => console.warn(error)
    );
  }

  private updateCategory() {
    const dto = {
      ...this.category,
      ...this.form.value
    };

    this.categoriesService.updateCategory(this.category.id, dto).subscribe(
      category => {
        this.categoriesService.categoryUpdated$.next();
        this.category = category;
      },
      error => console.warn(error)
    );
  }

  private buildForm(category: AdminAddOrUpdateCategoryDto) {
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
