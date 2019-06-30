import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { NotFoundExceptionFilter } from './shared/filters/not-found-exception.filter';

export const distFolder = join(process.cwd(), '..', '..', 'dist');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  const notFoundExceptionFilter = app.get<NotFoundExceptionFilter>(NotFoundExceptionFilter);
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(notFoundExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(bodyParser.json());

  await app.listen(AppModule.port, () => console.log(`It's rolling on ${AppModule.port}!`));
}
bootstrap();
