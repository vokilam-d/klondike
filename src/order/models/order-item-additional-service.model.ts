import { AdditionalService } from '../../additional-service/models/additional-service.model';
import { prop } from '@typegoose/typegoose';
import { MultilingualTextDto } from '../../shared/dtos/shared-dtos/multilingual-text.dto';

export class OrderItemAdditionalService implements Omit<AdditionalService, 'clientName' | 'isEnabled' | '_id'> {
  @prop()
  id: number;

  @prop()
  name: MultilingualTextDto;

  @prop()
  price: number;
}
