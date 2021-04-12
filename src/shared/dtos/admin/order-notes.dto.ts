import { OrderNotes } from '../../../order/models/order-notes.model';
import { Expose } from 'class-transformer';

export class AdminOrderNotesDto implements OrderNotes {
  @Expose() aboutCustomer: string;
  @Expose() fromAdmin: string;
  @Expose() fromCustomer: string;
}
