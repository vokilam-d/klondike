import { ClassSerializerInterceptor, Controller, Get, Param, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AutocompleteItemDto } from '../shared/dtos/client/autocomplete-item.dto';
import { ClientLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@Controller('autocomplete')
export class AutocompleteController {

  constructor(private readonly autocompleteService: AutocompleteService
  ) { }

  @Get(':query')
  async autocomplete(@Param('query') query: string, @ClientLang() lang: Language): Promise<ResponseDto<AutocompleteItemDto[]>> {

    const items = await this.autocompleteService.findByQuery(query, lang);

    return {
      data: items
    };
  }

}
