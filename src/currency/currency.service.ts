import { HttpService, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Currency } from './models/currency.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { ECurrencyCode } from '../shared/enums/currency.enum';
import { AdminCurrencyDto } from '../shared/dtos/admin/currency.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  constructor(@InjectModel(Currency.name) private readonly currencyModel: ReturnModelType<typeof Currency>,
              private readonly http: HttpService) {
  }

  async getAllCurrencies(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();

    return currencies.map(currency => currency.toJSON());
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateExchangeRates(): Promise<Currency[]> {
    const currencies = await this.currencyModel.find().exec();

    try {
      const response = await this.http.get(this.auctionExchangeRateUrl).toPromise();
      const exchangeRates: ExchangeRates = response.data;

      for (const currency of currencies) {
        const rate: ExchangeRate = exchangeRates[currency.id];
        if (!rate || currency.id === ECurrencyCode.UAH) {
          continue;
        }

        currency.exchangeRate = rate.bid;

        await currency.save();
        this.logger.log(`Updated currency '${currency.id}' exchange rate to ${currency.exchangeRate}`);
      }
    } catch (ex) {
      this.logger.error('Could not update exchange rates:');
      this.logger.error(ex);
    }

    return currencies.map(currency => currency.toJSON());
  }

  async updateCurrency(currencyCode: ECurrencyCode, currencyDto: AdminCurrencyDto): Promise<Currency> {
    const found = await this.currencyModel.findById(currencyCode);
    if (!found) {
      throw new NotFoundException(`Currency '${currencyCode}' not found`);
    }

    Object.keys(currencyDto).forEach(key => found[key] = currencyDto[key]);
    await found.save();

    return found.toJSON();
  }
}
