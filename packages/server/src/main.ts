import { NestFactory } from '@nestjs/core';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as serveStatic from 'serve-static';
import { join } from 'path';
import { AppModule } from './app.module';
import { enableProdMode } from '@angular/core';
import { NotFoundExceptionFilter } from './shared/filters/not-found-exception.filter';

enableProdMode();

export const distFolder = join(process.cwd(), '..', '..', 'dist');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.engine('html', ngExpressEngine({ bootstrap: null }));
  app.set('views', distFolder);
  app.set('view engine', 'html');

  const notFoundExceptionFilter = app.get<NotFoundExceptionFilter>(NotFoundExceptionFilter);
  app.setGlobalPrefix('/api');
  app.useGlobalFilters(notFoundExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(serveStatic( join(distFolder, 'web'), { index: false } ));

  await app.listen(AppModule.port, () => console.log(`It's rolling on ${AppModule.port}!`));
}
bootstrap();
