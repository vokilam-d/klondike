import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as fastifyMultipart from 'fastify-multipart';
import * as fastifyStatic from 'fastify-static';
import { join } from 'path';
import * as requestIp from 'request-ip';

declare const module: any;

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ ignoreTrailingSlash: true });
  fastifyAdapter.register(fastifyMultipart);
  fastifyAdapter.register(fastifyStatic, { root: join(__dirname, '..') }); // todo remove this

  const app = await NestFactory.create(AppModule, fastifyAdapter);
  const globalExceptionFilter = app.get<GlobalExceptionFilter>(GlobalExceptionFilter);

  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(requestIp.mw());

  await app.listen(AppModule.port, () => console.log(`It's rolling on ${AppModule.port}!`));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
