export interface ICart {
  status: ECartStatus;
  items: ICartItem[];
}

export enum ECartStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED'
}

export interface ICartItem {
  sku: string;
  qty: number;
  details: ICartItemDetails;
}

export interface ICartItemDetails {
  name: string;
}