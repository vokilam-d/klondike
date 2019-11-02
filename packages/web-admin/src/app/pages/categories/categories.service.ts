import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import {
  AdminAddOrUpdateCategoryDto,
  AdminCategoriesTreeDto,
  AdminResponseCategoryDto
} from '../../../../../backend/src/shared/dtos/admin/category.dto';

@Injectable()
export class WebAdminCategoriesService {

  selectedCategoryId: number;
  categoryUpdated$ = new Subject();

  constructor(private http: HttpClient) {
  }

  fetchCategoriesTree(): Observable<AdminCategoriesTreeDto> {
    return this.http.get<AdminCategoriesTreeDto>(`http://localhost:3500/api/v1/admin/categories/tree`);
  }

  fetchCategory(id: string) {
    return this.http.get<AdminResponseCategoryDto>(`http://localhost:3500/api/v1/admin/categories/${id}`);
  }

  setSelectedCategoryId(id: number) {
    this.selectedCategoryId = id;
  }

  removeSelectedCategoryId() {
    this.selectedCategoryId = null;
  }

  saveCategory(category: AdminAddOrUpdateCategoryDto, parentId: string) {
    const categoryDto: AdminAddOrUpdateCategoryDto = {
      ...category,
      parentId: parseInt(parentId)
    };

    return this.http.post<AdminResponseCategoryDto>(`http://localhost:3500/api/v1/admin/categories`, categoryDto);
  }

  updateCategory(id: number, categoryDto: AdminResponseCategoryDto) {
    return this.http.put<AdminResponseCategoryDto>(`http://localhost:3500/api/v1/admin/categories/${id}`, categoryDto);
  }

  deleteCategory(id: number) {
    return this.http.delete(`http://localhost:3500/api/v1/admin/categories/${id}`);
  }
}
