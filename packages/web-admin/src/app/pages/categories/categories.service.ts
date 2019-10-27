import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminCategoryDto } from '@shared/dtos/admin/category.dto';

@Injectable()
export class WebAdminCategoriesService {

  activeCategory: AdminCategoryDto;

  constructor(private http: HttpClient) {
  }

  fetchCategories(): Observable<AdminCategoryDto[]> {
    return this.http.get<AdminCategoryDto[]>(`http://localhost:3500/api/v1/categories`);
  }

  fetchCategory(id: string) {
    return this.http.get<AdminCategoryDto>(`http://localhost:3500/api/v1/categories/${id}`);
  }

  setActiveCategory(category: AdminCategoryDto) {
    this.activeCategory = category;
  }

  removeActiveCategory() {
    this.setActiveCategory(null);
  }

  saveCategory(category: AdminCategoryDto, parentId: string) {
    console.log(category);
    console.log(parentId);
  }

  deleteCategory(id: string) {
    console.log(id);
  }
}
