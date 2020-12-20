import { AdditionalService } from '../../../additional-service/models/additional-service.model';
import { Expose } from 'class-transformer';

export class ClientAdditionalServiceDto implements Pick<AdditionalService, 'id' | 'price'>, Pick<Record<keyof AdditionalService, string>, 'name'> {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: number;
}
