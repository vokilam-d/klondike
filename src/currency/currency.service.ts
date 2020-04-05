import { HttpService, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Currency } from './models/currency.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { DEFAULT_CURRENCY, ECurrencyCode } from '../shared/enums/currency.enum';
import { AdminCurrencyDto } from '../shared/dtos/admin/currency.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CronExpression } from '@nestjs/schedule';
import { PrimaryInstanceCron } from '../shared/decorators/primary-instance-cron.decorator';
import { Subject } from 'rxjs';

type ExchangeRate = {
  bid: number;
  ask: number;
  bidCount: number;
  askCount: number;
  bidSum: number;
  askSum: number;
}

type ExchangeRates = {
  [currency in ECurrencyCode]: ExchangeRate;
}

@Injectable()
export class CurrencyService {

  private logger = new Logger(CurrencyService.name);
  private auctionExchangeRateUrl = 'http://api.minfin.com.ua/auction/info/58ec1c89d7ea9221853cf7b777a02c686c455a03/';
  echangeRatesUpdated$: Subject<Currency[]> = new Subject();

  constructor(@InjectModel(Currency.name) private readonly currencyModel: ReturnModelType<typeof Currency>,
              private readonly http: HttpService) {
  }

  async getAllCurrencies(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();

    return currencies.map(currency => currency.toJSON());
  }

  @PrimaryInstanceCron(CronExpression.EVERY_30_MINUTES)
  async updateExchangeRates(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();
    let exchangeRates: ExchangeRates;

    try {
      const response = await this.http.get(this.auctionExchangeRateUrl).toPromise();
      exchangeRates = response.data;
    } catch (ex) {
      this.logger.error('Could not fetch exchange rates:');
      throw ex;
    }

    for (let currency of currencies) {
      const rate: ExchangeRate = exchangeRates[currency.id];
      if (!rate || currency.id === ECurrencyCode.UAH) {
        continue;
      }

      currency.exchangeRate = rate.bid;
      currency = await currency.save();

      this.logger.log(`Updated currency '${currency.id}' exchange rate to ${currency.exchangeRate}`);
    }

    const converted: Currency[] = currencies.map(currency => currency.toJSON());
    this.echangeRatesUpdated$.next(converted);
    return converted;
  }

  async updateCurrency(currencyCode: ECurrencyCode, currencyDto: AdminCurrencyDto): Promise<Currency> {
    const found = await this.currencyModel.findById(currencyCode);
    if (!found) {
      throw new NotFoundException(`Currency '${currencyCode}' not found`);
    }

    Object.keys(currencyDto).forEach(key => found[key] = currencyDto[key]);
    await found.save();

    const foundJson = found.toJSON();
    this.echangeRatesUpdated$.next([ foundJson ]);

    return foundJson;
  }

  async getExchangeRate(currencyCode: ECurrencyCode): Promise<number> {
    if (currencyCode === DEFAULT_CURRENCY) {
      return 1;
    }

    const foundCurrency = await this.currencyModel.findById(currencyCode).exec();
    if (!foundCurrency) {
      throw new NotFoundException(`Currency '${currencyCode}' not found`);
    }

    return foundCurrency.exchangeRate;
  }
}
