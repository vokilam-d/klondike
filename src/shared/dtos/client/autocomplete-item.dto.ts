import { Expose } from 'class-transformer';
import { AutocompleteItemType } from '../../enums/autocomplete-item-type.enum';

export class AutocompleteItemDto {

  @Expose()
  slug: string;

  @Expose()
  name: string;

  @Expose()
  type: AutocompleteItemType;

  @Expose()
  mediaUrl: string;

}
