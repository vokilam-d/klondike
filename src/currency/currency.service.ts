import { HttpService, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Currency } from './models/currency.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { CurrencyCodeEnum, DEFAULT_CURRENCY } from '../shared/enums/currency.enum';
import { AdminCurrencyDto } from '../shared/dtos/admin/currency.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CronExpression } from '@nestjs/schedule';
import { CronProdPrimaryInstance } from '../shared/decorators/primary-instance-cron.decorator';
import { Subject } from 'rxjs';
import { __ } from '../shared/helpers/translate/translate.function';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { Language } from '../shared/enums/language.enum';

interface ExchangeRate {
  ccy: 'EUR' | 'USD';
  base_ccy: 'UAH';
  buy: string;
  sale: string;
}

@Injectable()
export class CurrencyService {

  private logger = new Logger(CurrencyService.name);
  private exchangeRateUrl = 'https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5';
  echangeRatesUpdated$: Subject<Currency[]> = new Subject();

  constructor(
    @InjectModel(Currency.name) private readonly currencyModel: ReturnModelType<typeof Currency>,
    private readonly http: HttpService
  ) { }

  async getAllCurrencies(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();

    return currencies.map(currency => currency.toJSON());
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_DAY_AT_3PM)
  async updateExchangeRates(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();
    let exchangeRates: ExchangeRate[];

    try {
      const response = await this.http.get(this.exchangeRateUrl).toPromise();
      exchangeRates = response.data;
    } catch (ex) {
      this.logger.error('Could not fetch exchange rates:');
      throw ex;
    }

    for (let currency of currencies) {
      const rate: ExchangeRate = exchangeRates.find(rate => rate.ccy.toLowerCase() === currency.id.toLowerCase())
      if (!rate || currency.id === CurrencyCodeEnum.UAH) { continue; }

      currency.exchangeRate = parseFloat(rate.sale);
      currency = await currency.save();

      this.logger.log(`Updated currency '${currency.id}' exchange rate to ${currency.exchangeRate}`);
    }

    const converted: Currency[] = currencies.map(currency => currency.toJSON());
    this.echangeRatesUpdated$.next(converted);
    return converted;
  }

  async updateCurrency(currencyCode: CurrencyCodeEnum, currencyDto: AdminCurrencyDto, lang: Language): Promise<Currency> {
    const found = await this.currencyModel.findById(currencyCode);
    if (!found) {
      throw new NotFoundException(__('Currency "$1" not found', lang, currencyCode));
    }

    Object.keys(currencyDto).forEach(key => found[key] = currencyDto[key]);
    await found.save();

    const foundJson = found.toJSON();
    this.echangeRatesUpdated$.next([ foundJson ]);

    return foundJson;
  }

  async getExchangeRate(currencyCode: CurrencyCodeEnum, lang: Language): Promise<number> {
    if (currencyCode === DEFAULT_CURRENCY) {
      return 1;
    }

    const foundCurrency = await this.currencyModel.findById(currencyCode).exec();
    if (!foundCurrency) {
      throw new NotFoundException(__('Currency "$1" not found', lang, currencyCode));
    }

    return foundCurrency.exchangeRate;
  }
}
