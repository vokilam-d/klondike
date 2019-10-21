import { Component, OnInit } from '@angular/core';
import { CategoriesService } from './categories.service';

@Component({
  selector: 'categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  categories: any[];

  constructor(private categoriesService: CategoriesService) {
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
