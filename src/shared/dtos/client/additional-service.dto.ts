import { AdditionalService } from '../../../additional-service/models/additional-service.model';
import { Expose } from 'class-transformer';
import { AdminAdditionalServiceDto } from '../admin/additional-service.dto';
import { Language } from '../../enums/language.enum';

export class ClientAdditionalServiceDto implements Pick<AdditionalService, 'id' | 'price'>, Pick<Record<keyof AdditionalService, string>, 'name'> {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: number;

  static transformToDto(additionalService: AdditionalService | AdminAdditionalServiceDto, lang: Language): ClientAdditionalServiceDto {
    return {
      id: additionalService.id,
      name: additionalService.clientName[lang],
      price: additionalService.price
    };
  }
}
