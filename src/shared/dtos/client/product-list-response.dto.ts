import { ClientFilterDto } from './filter.dto';
import { ResponseDto } from '../shared-dtos/response.dto';
import { ClientProductListItemDto } from './product-list-item.dto';

export class ClientProductListResponseDto extends ResponseDto<ClientProductListItemDto[]> {
  filters?: ClientFilterDto[];
}
