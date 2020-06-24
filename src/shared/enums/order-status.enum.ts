export enum OrderStatusEnum {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  READY_TO_PACK = 'READY_TO_PACK',
  PACKED = 'PACKED',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',

  // 1st variant of finalisation - everything is ok, recipient took the parcel
  FINISHED = 'FINISHED',

  // 2nd variant - we return the parcel after recipient denied to take it or didn't show up
  RECIPIENT_DENIED = 'RECIPIENT_DENIED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',

  // 3rd variant - we refused to return the parcel after recipient denied to take it or didn't show up
  REFUSED_TO_RETURN = 'REFUSED_TO_RETURN',

  // 4th variant - order is canceled
  CANCELED = 'CANCELED'
}

export const FinalOrderStatuses: OrderStatusEnum[] = [
  OrderStatusEnum.FINISHED,
  OrderStatusEnum.RECIPIENT_DENIED,
  OrderStatusEnum.RETURNING,
  OrderStatusEnum.RETURNED,
  OrderStatusEnum.REFUSED_TO_RETURN
];
