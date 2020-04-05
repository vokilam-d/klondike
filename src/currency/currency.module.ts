import { HttpModule, Module } from '@nestjs/common';
import { AdminCurrencyController } from './admin-currency.controller';
import { CurrencyService } from './currency.service';
import { Currency, CurrencyModel } from './models/currency.model';
import { MongooseModule } from '@nestjs/mongoose';

const currencyModel = {
  name: CurrencyModel.modelName,
  schema: CurrencyModel.schema,
  collection: Currency.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([currencyModel]),
    HttpModule
  ],
  controllers: [AdminCurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService]
})
export class CurrencyModule {}
