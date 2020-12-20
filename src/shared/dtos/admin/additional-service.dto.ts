import { AdditionalService } from '../../../additional-service/models/additional-service.model';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNumber } from 'class-validator';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminAdditionalServiceDto implements Pick<AdditionalService, 'id' | 'isEnabled' | 'name' | 'clientName' | 'price'> {
  @Expose()
  id: number;

  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;

  @Expose()
  @Type(() => MultilingualTextDto)
  clientName: MultilingualTextDto;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsNumber()
  price: number;
}
