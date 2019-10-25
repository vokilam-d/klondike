import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import { BackendAppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { FastifyAdapter } from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create(BackendAppModule, new FastifyAdapter());
  const globalExceptionFilter = app.get<GlobalExceptionFilter>(GlobalExceptionFilter);

  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.json());

  await app.listen(BackendAppModule.port, () => console.log(`It's rolling on ${BackendAppModule.port}!`));
}
bootstrap();
