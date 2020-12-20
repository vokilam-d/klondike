import { Expose } from 'class-transformer';
import { AdditionalService } from '../../../additional-service/models/additional-service.model';

export abstract class BaseOrderItemAdditionalServiceDto implements Omit<AdditionalService, 'clientName' | 'isEnabled' | '_id'> {
  @Expose()
  id: number;

  abstract name: any;

  @Expose()
  price: number;
}
