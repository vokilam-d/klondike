import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { SharedModule } from './shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './product/product.module';
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
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NovaPoshtaModule } from './nova-poshta/nova-poshta.module';
import { TasksModule } from './tasks/tasks.module';
import { CommonRequestInterceptor } from './shared/interceptors/common-request.interceptor';
import { BlogModule } from './blog/blog.module';
import { AggregatorModule } from './aggregator/aggregator.module';
import { AutocompleteModule } from './autocomplete/autocomplete.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGO_URI,
        retryDelay: 500,
        retryAttempts: 3,
        autoCreate: true,
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      }),
      inject: []
    }),
    ScheduleModule.forRoot(),
    SharedModule,

    CategoryModule,
    ProductModule,
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
    CurrencyModule,
    AuthModule,
    UserModule,
    NovaPoshtaModule,
    TasksModule,
    BlogModule,
    AggregatorModule,
    AutocompleteModule,
    LoggerModule
  ],
  providers: [
    GlobalExceptionFilter,
    CommonRequestInterceptor
  ],
  controllers: []
})
export class AppModule {
  static port: number = +process.env.PORT || 3000;

  constructor() {
  }
}
