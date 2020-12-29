import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Language } from '../enums/language.enum';
import { adminDefaultLanguage, clientDefaultLanguage } from '../constants';

const getLang = (context: ExecutionContext, defaultLang: Language) => {
  const req = context.switchToHttp().getRequest<FastifyRequest>();
  const queryLang = req.query.lang;

  const isInEnum = Object.values(Language).includes(queryLang);

  return isInEnum ? queryLang : defaultLang;
};

export const ClientLang = createParamDecorator((data: unknown, context: ExecutionContext) => {
  return getLang(context, clientDefaultLanguage);
});

export const AdminLang = createParamDecorator((data: unknown, context: ExecutionContext) => {
  return getLang(context, adminDefaultLanguage);
});
