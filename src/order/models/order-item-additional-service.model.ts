import { AdditionalService } from '../../additional-service/models/additional-service.model';
import { prop } from '@typegoose/typegoose';

export class OrderItemAdditionalService implements Omit<AdditionalService, 'clientName' | 'isEnabled' | '_id'> {
  @prop()
  id: number;

  @prop()
  name: string;

  @prop()
  price: number;
}
