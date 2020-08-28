import { ResponseDto } from '../shared-dtos/response.dto';
import { ClientProductDto } from './product.dto';
import { ClientLinkedCategoryDto } from './linked-category.dto';
import { Expose, Type } from 'class-transformer';

export class ClientProductResponseDto extends ResponseDto<ClientProductDto> {
  @Expose()
  @Type(() => ClientLinkedCategoryDto)
  categories: ClientLinkedCategoryDto[];
}
