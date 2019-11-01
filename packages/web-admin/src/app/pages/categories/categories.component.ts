import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebAdminCategoriesService } from './categories.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminResponseCategoryDto } from '../../../../../backend/src/shared/dtos/admin/category.dto';

@Component({
  selector: 'categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class WebAdminCategoriesComponent implements OnInit, OnDestroy {

  categories: AdminResponseCategoryDto[];

  constructor(private categoriesService: WebAdminCategoriesService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.fetchCategories();
  }

  ngOnDestroy(): void {
    this.categoriesService.removeActiveCategory();
  }

  fetchCategories() {
    this.categoriesService.fetchCategories().subscribe(
      categories => {
        this.categories = categories;
      },
      error => console.warn(error)
    );
  }

  selectCategory(category: AdminResponseCategoryDto) {
    this.categoriesService.setActiveCategory(category);
    this.router.navigate(['edit', category.id], { relativeTo: this.route });
  }

  addRootCategory() {
    this.addCategory(0);
  }

  addSubCategory() {
    const id = this.categoriesService.activeCategory.id;
    this.addCategory(id);
  }

  private addCategory(id: string | number) {
    this.categoriesService.removeActiveCategory();
    this.router.navigate(['add', 'parent', id], { relativeTo: this.route });
  }
}
