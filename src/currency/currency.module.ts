import { Module } from '@nestjs/common';
import { AdminCurrencyController } from './admin-currency.controller';
import { CurrencyService } from './currency.service';
import { Currency, CurrencyModel } from './models/currency.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from '../product/product.module';

const currencyModel = {
  name: CurrencyModel.modelName,
  schema: CurrencyModel.schema,
  collection: Currency.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([currencyModel]), ProductModule],
  controllers: [AdminCurrencyController],
  providers: [CurrencyService]
})
export class CurrencyModule {}
