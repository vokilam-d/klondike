import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import * as fastifyMultipart from 'fastify-multipart';
import * as fastifyStatic from 'fastify-static';
import * as fastifyCookie from 'fastify-cookie';
import { join } from 'path';
import * as requestIp from 'request-ip';
import { isProdEnv } from './shared/helpers/is-prod-env.function';
import * as fastifyOauth2 from 'fastify-oauth2';
import { authConstants } from './auth/auth-constants';

declare const module: any;

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ ignoreTrailingSlash: true, maxParamLength: 200 });
  fastifyAdapter.register(fastifyMultipart);
  fastifyAdapter.register(fastifyCookie);
  registerOAuth(fastifyAdapter);
  if (!isProdEnv()) {
    fastifyAdapter.register(fastifyStatic, { root: join(__dirname, '..') });
  }

  const app = await NestFactory.create(AppModule, fastifyAdapter);
  const globalExceptionFilter = app.get<GlobalExceptionFilter>(GlobalExceptionFilter);

  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors();
  app.use(helmet());
  app.use(compression());
  app.use(requestIp.mw());

  await app.listen(AppModule.port, '0.0.0.0', () => console.log(`It's rolling on ${AppModule.port}!`));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();

function registerOAuth(fastifyAdapter: FastifyAdapter) { // todo research better way (nestjs-way)
  const googleOAuthOptions: fastifyOauth2.FastifyOAuth2Options = {
    name: authConstants.GOOGLE_OAUTH_NAMESPACE,
    credentials: {
      client: {
        id: process.env.GOOGLE_OAUTH_ID,
        secret: process.env.GOOGLE_OAUTH_SECRET
      },
      auth: (fastifyOauth2 as any).GOOGLE_CONFIGURATION
    },
    scope: ['profile email'],
    startRedirectPath: '/api/v1/customer/google',
    callbackUri: `${process.env.DEPLOY_HOST}/api/v1/customer/google/callback`
  }
  fastifyAdapter.register(fastifyOauth2, googleOAuthOptions);

  const facebookOAuthOptions: fastifyOauth2.FastifyOAuth2Options = {
    name: authConstants.FACEBOOK_OAUTH_NAMESPACE,
    credentials: {
      client: {
        id: process.env.FACEBOOK_OAUTH_ID,
        secret: process.env.FACEBOOK_OAUTH_SECRET
      },
      auth: (fastifyOauth2 as any).FACEBOOK_CONFIGURATION
    },
    scope: ['email public_profile'],
    startRedirectPath: '/api/v1/customer/facebook',
    callbackUri: `${process.env.DEPLOY_HOST}/api/v1/customer/facebook/callback`
  }
  fastifyAdapter.register(fastifyOauth2, facebookOAuthOptions);
}
