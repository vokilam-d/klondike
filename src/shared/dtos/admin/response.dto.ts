export class ResponseDto<T> {
  data: T;
}

export class ResponsePaginationDto<T> extends ResponseDto<T> {
  page: number;
  pagesTotal: number;
  itemsTotal: number;
  itemsFiltered?: number;
}
