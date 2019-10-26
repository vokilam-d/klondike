import { Component, OnInit } from '@angular/core';
import { WebAdminCategoriesService } from './categories.service';

@Component({
  selector: 'categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class WebAdminCategoriesComponent implements OnInit {

  categories: any[];

  constructor(private categoriesService: WebAdminCategoriesService) {
  }

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories(): any {
    this.categoriesService.fetchCategories().subscribe(
      categories => {
        console.log(categories);
        this.categories = categories;
      },
      error => console.warn(error)
    );
  }

}
