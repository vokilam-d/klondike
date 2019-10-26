import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private logger = new Logger(GlobalExceptionFilter.name);

  constructor() {
  }

  catch(exception: Error, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const path = req.url;
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
        stack: exception.stack.split('\n    '),
        timestamp: new Date().toISOString(),
        path
      });
    }

    res.status(status).send({
      statusCode: status,
      ...(httpError ? httpError : {}),
      timestamp: new Date().toISOString(),
      path
    });
  }

}
