export interface IInventory {
  id: string;
  qty: number;
  carted: ICartedInventory[];
}

export interface ICartedInventory {
  qty: number;
  cartId: number;
  timestamp: Date | any;
}