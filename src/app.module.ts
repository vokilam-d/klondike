import { Module } from '@nestjs/common';
import { BackendCategoryModule } from './category/category.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { SharedModule } from './shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendConfigService } from './shared/config/config.service';
import { EConfig } from '../config/config.enum';
import { BackendProductModule } from './product/backend-product.module';
import { BackendCartModule } from './cart/cart.module';
import { BackendInventoryModule } from './inventory/inventory.module';
import { AttributeModule } from './attribute/attribute.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (_config: BackendConfigService) => ({
        uri: _config.get(EConfig.MONGO_URI),
        retryDelay: 500,
        retryAttempts: 3,
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
      }),
      inject: [BackendConfigService]
    }),
    SharedModule,

    BackendCategoryModule,
    BackendProductModule,
    BackendCartModule,
    BackendInventoryModule,
    AttributeModule
  ],
  providers: [GlobalExceptionFilter]
})
export class BackendAppModule {
  static port: number;

  constructor(private readonly _config: BackendConfigService) {
    BackendAppModule.port = BackendAppModule.normalizePort(_config.get(EConfig.PORT));
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
