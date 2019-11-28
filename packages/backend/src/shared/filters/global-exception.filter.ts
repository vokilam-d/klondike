import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private logger = new Logger(GlobalExceptionFilter.name);

  constructor() {
  }

  catch(exception: Error, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest<any>>();
    const res = ctx.getResponse<FastifyReply<any>>();
    const path = req.raw.url;
    const method = req.raw.method;
    let status;
    let httpError;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      httpError = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error({
        statusCode: status,
        message: exception.message,
        stack: exception.stack.split('\n').map(str => str.trim()),
        timestamp: new Date().toISOString(),
        method,
        path
      });
    }

    res.status(status).send({
      ...(httpError ? httpError : {}),
      statusCode: status,
      timestamp: new Date().toISOString(),
      method,
      path
    });
  }

}
