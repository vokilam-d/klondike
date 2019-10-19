import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from './category.service';

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {

  constructor(private route: ActivatedRoute,
              private categoryService: CategoryService) {
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.categoryService.fetchCategory(slug).subscribe(
      category => {
        console.log(category);
      },
      error => console.warn(error)
    );
  }

}
