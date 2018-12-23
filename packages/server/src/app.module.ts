import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { SsrService } from './ssr.service';
import { NotFoundExceptionFilter } from './shared/filters/not-found-exception.filter';
import { SharedModule } from './shared/shared.module';
import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { ConfigService } from './shared/config/config.service';
import { EConfig } from '../config/config.enum';
import { Error } from 'tslint/lib/error';

@Module({
  imports: [
    CategoryModule,
    SharedModule,
    MongooseModule.forRootAsync({
      useFactory: async (_config: ConfigService) => ({
        uri: _config.get(EConfig.MONGO_URI)
      }),
      inject: [ConfigService]
    } as MongooseModuleAsyncOptions)
  ],
  controllers: [],
  components: [],
  providers: [SsrService, NotFoundExceptionFilter]
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
