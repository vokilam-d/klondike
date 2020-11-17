import { Expose } from 'class-transformer';
import { AdditionalService } from '../../../additional-service/models/additional-service.model';

export class OrderItemAdditionalServiceDto implements Omit<AdditionalService, 'clientName' | 'isEnabled' | '_id'> {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: number;
}
