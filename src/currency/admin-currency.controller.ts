import { Body, Controller, Get, Param, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ResponseDto } from '../shared/dtos/shared-dtos/response.dto';
import { AdminCurrencyDto } from '../shared/dtos/admin/currency.dto';
import { plainToClass } from 'class-transformer';
import { CurrencyCodeEnum } from '../shared/enums/currency.enum';
import { UserJwtGuard } from '../auth/guards/user-jwt.guard';
import { BaseShipmentDto } from '../shared/dtos/shared-dtos/base-shipment.dto';
import { AdminLang } from '../shared/decorators/lang.decorator';
import { Language } from '../shared/enums/language.enum';

@UseGuards(UserJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('admin/currencies')
export class AdminCurrencyController {

  constructor(private readonly currencyService: CurrencyService) {
  }

  @Get()
  async getAllCurrencies(): Promise<ResponseDto<AdminCurrencyDto[]>> {
    const currencies = await this.currencyService.getAllCurrencies();

    return {
      data: plainToClass(AdminCurrencyDto, currencies, { excludeExtraneousValues: true })
    }
  }

  @Post('update-rates')
  async updateExchangeRates(): Promise<ResponseDto<AdminCurrencyDto[]>> {
    const currencies = await this.currencyService.updateExchangeRates();

    return {
      data: plainToClass(AdminCurrencyDto, currencies, { excludeExtraneousValues: true })
    }
  }

  @Put(':currencyCode')
  async updateCurrency(
    @Param('currencyCode') currencyCode: CurrencyCodeEnum,
    @Body() currencyDto: AdminCurrencyDto,
    @AdminLang() lang: Language
  ): Promise<ResponseDto<AdminCurrencyDto>> {

    const currency = await this.currencyService.updateCurrency(currencyCode, currencyDto, lang);

    return {
      data: plainToClass(AdminCurrencyDto, currency, { excludeExtraneousValues: true })
    }
  }
}
