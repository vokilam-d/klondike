import { AdditionalService } from '../../../additional-service/models/additional-service.model';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminAdditionalServiceDto implements Pick<AdditionalService, 'id' | 'isEnabled' | 'name' | 'clientName' | 'price'> {
  @Expose()
  id: number;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  @IsOptional()
  clientName: string;

  @Expose()
  @IsBoolean()
  isEnabled: boolean;

  @Expose()
  @IsNumber()
  price: number;
}
