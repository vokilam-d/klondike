export class CommonResponseDto<T> {
  data: T;
}

export class ListResponseDto<T> extends CommonResponseDto<T[]> {
  page: number;
  pagesTotal: number;
  itemsTotal: number;
  itemsFiltered?: number;
}
