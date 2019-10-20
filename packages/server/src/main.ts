import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalExceptionFilter = app.get<GlobalExceptionFilter>(GlobalExceptionFilter);

  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.json());

  await app.listen(AppModule.port, () => console.log(`It's rolling on ${AppModule.port}!`));
}
bootstrap();
