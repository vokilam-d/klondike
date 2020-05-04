import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';
import { ServerResponse } from 'http';

@Injectable()
export class CommonRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    if (!req.cookies.clientId) {
      const clientId = this.generateClientId();
      const res = context.switchToHttp().getResponse<FastifyReply<ServerResponse>>();

      req.cookies.clientId = clientId;
      res.setCookie('clientId', clientId);
    }

    return next.handle();
  }

  private generateClientId(): string {
    return randomBytes(8).toString('hex');
  }
}
