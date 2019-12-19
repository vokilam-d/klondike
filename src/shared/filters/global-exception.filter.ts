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
    let statusCode;
    let httpError;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      httpError = exception.getResponse();
    } else if (this.isMongoDuplicationException(exception)) {
      statusCode = HttpStatus.BAD_REQUEST;
      httpError = { error: 'Bad Request', message: this.getMongoDuplicationMessage(exception) };

    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error({
        statusCode,
        message: exception.message,
        stack: exception.stack.split('\n').map(str => str.trim()),
        timestamp: new Date().toISOString(),
        method,
        path
      });
    }

    res.status(statusCode).send({
      ...(httpError ? httpError : {}),
      statusCode,
      timestamp: new Date().toISOString(),
      method,
      path
    });
  }

  private isMongoDuplicationException(exception: any) {
    return exception.code === 11000 || exception.code === 11001
  }

  private getMongoDuplicationMessage(exception: Error) {
    const keyValueRegex = exception.message.match(/key:\s+{\s+(\w*):\s+(?:"(.*)"|(.*))\s+}/) || [];
    const key = keyValueRegex[1] || '';
    const value = keyValueRegex[2] || keyValueRegex[3] || '';

    return `${key} '${value}' already exist`;
  }
}
