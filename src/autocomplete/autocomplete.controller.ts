import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AutocompleteItemDto } from '../shared/dtos/client/autocomplete-item.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('autocomplete')
export class AutocompleteController {

  constructor(private readonly autocompleteService: AutocompleteService
  ) { }

  @Get(':query')
  async autocomplete(@Param('query') query: string): Promise<ResponseDto<AutocompleteItemDto[]>> {

    const items = await this.autocompleteService.findByQuery(query);

    return {
      data: items
    };
  }

}
