import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { User } from '../../user/models/user.model';
import { DocumentType } from '@typegoose/typegoose';
import { Customer } from '../../customer/models/customer.model';

export const ValidatedUser = createParamDecorator((data: unknown, context: ExecutionContext): DocumentType<User | Customer> => {
  const req = context.switchToHttp().getRequest<FastifyRequest>();
  return (req as any).user;
});
