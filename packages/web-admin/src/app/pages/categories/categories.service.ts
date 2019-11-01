import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminCategoriesTreeDto,
  AdminRequestCategoryDto,
  AdminResponseCategoryDto
} from '../../../../../backend/src/shared/dtos/admin/category.dto';

@Injectable()
export class WebAdminCategoriesService {

  activeCategory: AdminResponseCategoryDto;

  constructor(private http: HttpClient) {
  }

  fetchCategories(): Observable<AdminCategoriesTreeDto> {
    return this.http.get<AdminCategoriesTreeDto>(`http://localhost:3500/api/v1/admin/categories`);
  }

  fetchCategory(id: string) {
    return this.http.get<AdminResponseCategoryDto>(`http://localhost:3500/api/v1/admin/categories/${id}`);
  }

  setActiveCategory(category: AdminResponseCategoryDto) {
    this.activeCategory = category;
  }

  removeActiveCategory() {
    this.setActiveCategory(null);
  }

  saveCategory(category: AdminRequestCategoryDto, parentId: string) {
    const categoryDto: AdminRequestCategoryDto = {
      ...category,
      parentId: parseInt(parentId)
    };

    return this.http.post(`http://localhost:3500/api/v1/admin/categories`, categoryDto);
  }

  deleteCategory(id: string) {
    console.log(id);
  }
}
