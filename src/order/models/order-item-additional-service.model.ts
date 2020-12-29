import { AdditionalService } from '../../additional-service/models/additional-service.model';
import { prop } from '@typegoose/typegoose';
import { MultilingualText } from '../../shared/models/multilingual-text.model';

export class OrderItemAdditionalService implements Omit<AdditionalService, 'clientName' | 'isEnabled' | '_id'> {
  @prop()
  id: number;

  @prop()
  name: MultilingualText;

  @prop()
  price: number;
}
