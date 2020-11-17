import { AdditionalService } from '../../../additional-service/models/additional-service.model';
import { Expose, Transform } from 'class-transformer';
import { AdminAdditionalServiceDto } from '../admin/additional-service.dto';

export class ClientAdditionalServiceDto implements Pick<AdditionalService, 'id' | 'name' | 'price'> {
  @Expose()
  id: number;

  @Expose()
  @Transform((value, obj: AdditionalService | AdminAdditionalServiceDto) => obj.clientName || value)
  name: string;

  @Expose()
  price: number;
}
