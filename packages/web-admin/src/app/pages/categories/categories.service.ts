import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  constructor(private http: HttpClient) { }

  fetchCategories(): any {
    return this.http.get<any[]>(`http://localhost:3500/api/v1/categories`);
  }
}
