import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { SharedModule } from './shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './shared/config/config.service';
import { EConfig } from '../config/config.enum';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { InventoryModule } from './inventory/inventory.module';
import { AttributeModule } from './attribute/attribute.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { ShippingMethodModule } from './shipping-method/shipping-method.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';
import { StoreReviewModule } from './reviews/store-review/store-review.module';
import { ProductReviewModule } from './reviews/product-review/product-review.module';
import { WysiwygModule } from './wysiwyg/wysiwyg.module';
import { EmailModule } from './email/email.module';
import { GoogleModule } from './google/google.module';
import { CurrencyModule } from './currency/currency.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (_config: ConfigService) => ({
        uri: _config.get(EConfig.MONGO_URI),
        retryDelay: 500,
        retryAttempts: 3,
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      }),
      inject: [ConfigService]
    }),
    SharedModule,

    CategoryModule,
    ProductModule,
    CartModule,
    InventoryModule,
    AttributeModule,
    CustomerModule,
    OrderModule,
    ShippingMethodModule,
    PaymentMethodModule,
    PdfGeneratorModule,
    StoreReviewModule,
    ProductReviewModule,
    WysiwygModule,
    EmailModule,
    GoogleModule,
    CurrencyModule
  ],
  providers: [GlobalExceptionFilter],
  controllers: []
})
export class AppModule {
  static port: number;

  constructor(private readonly _config: ConfigService) {
    AppModule.port = AppModule.normalizePort(_config.get(EConfig.PORT));
  }

  private static normalizePort(portArg: number | string): number {
    const port: number = typeof portArg === 'string' ? parseInt(portArg, 10) : portArg;
    if (isNaN(port)) {
      throw new Error('Invalid port number!');
    } else {
      return port;
    }
  }
}
