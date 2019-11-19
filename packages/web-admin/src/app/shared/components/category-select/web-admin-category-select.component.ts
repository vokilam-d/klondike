import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AdminCategoriesTreeDto,
  AdminCategoryTreeItem
} from '../../../../../../backend/src/shared/dtos/admin/category.dto';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// interface CategorySelectOption {
//   category: AdminCategoryTreeItem;
//   isSelected: boolean;
// }

type CategorySelectOption = AdminCategoryTreeItem & { isSelected: boolean; children: CategorySelectOption[]; };

@Component({
  selector: 'web-admin-category-select',
  templateUrl: './web-admin-category-select.component.html',
  styleUrls: ['./web-admin-category-select.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => WebAdminCategorySelectComponent),
    multi: true
  }]
})
export class WebAdminCategorySelectComponent implements OnInit, ControlValueAccessor {

  isVisible: boolean = false;
  isDisabled: boolean = false;
  options: CategorySelectOption[] = [];
  get selectedOptions(): CategorySelectOption[] {
    const selected = [];
    const populate = (options: CategorySelectOption[]) => {
      options.forEach(option => {
        if (option.isSelected) {
          selected.push(option);
        }
        populate(option.children);
      });
    };

    populate(this.options);
    return selected;
  }

  private _value: number[];
  get value(): number[] {
    return this.selectedOptions.map(option => option.id);
  }
  set value(categoryIds: number[]) {
    this._value = categoryIds;
    this.setOptionsSelectedState(this.options);
    this.onChange(categoryIds);
    this.onTouched();
  }

  @Input() multi: boolean = false;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.init();
  }

  private init() {
    this.http.get<AdminCategoriesTreeDto>(`http://localhost:3500/api/v1/admin/categories/tree`).subscribe(
      tree => {
        this.options = this.buildOptions(tree.categories);
      },
      error => console.warn(error)
    );
  }

  onChange = (_: any) => {};

  onTouched = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(value: number[]): void {
    if (value === null) {
      value = [];
    }

    if (!Array.isArray(value)) {
      throw new Error(`Value for ${WebAdminCategorySelectComponent.name} must be array of numbers`);
    }

    this.value = value;
    this.setOptionsSelectedState(this.options);
  }

  toggleOption(option: CategorySelectOption, isSelected = !option.isSelected) {
    option.isSelected = isSelected;
    this.onChange(this.value);
    this.onTouched();
  }

  unselectOption(event: Event, option: CategorySelectOption) {
    event.stopPropagation();

    this.toggleOption(option, false);
  }

  toggleVisibility(isVisible = !this.isVisible) {
    this.isVisible = isVisible;
  }

  private buildOptions(categories: AdminCategoryTreeItem[]): CategorySelectOption[] {
    return categories.map(({ id, name, children }) => {
      return {
        id,
        name,
        children: this.buildOptions(children),
        isSelected: this._value.includes(id)
      }
    });
  }

  private setOptionsSelectedState(options: CategorySelectOption[]): void {
    options.forEach(option => {
      option.isSelected = this._value.includes(option.id);
      this.setOptionsSelectedState(option.children);
    });
  }
}
