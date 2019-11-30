import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { BackendAppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as fastifyMultipart from 'fastify-multipart';
import * as fastifyStatic from 'fastify-static';
import { join } from 'path';

declare const module: any;

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.register(fastifyMultipart);
  fastifyAdapter.register(fastifyStatic, { root: join(__dirname, '..') }); // todo remove this

  const app = await NestFactory.create(BackendAppModule, fastifyAdapter);
  const globalExceptionFilter = app.get<GlobalExceptionFilter>(GlobalExceptionFilter);

  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());

  await app.listen(BackendAppModule.port, () => console.log(`It's rolling on ${BackendAppModule.port}!`));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
