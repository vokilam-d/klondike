import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Subject } from 'rxjs';
import { User } from '../../user/models/user.model';
import { Customer } from '../../customer/models/customer.model';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

  private logger = new Logger(GlobalExceptionFilter.name);
  public internalServerError$ = new Subject<any>();

  constructor() {
  }

  catch(exception: Error, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest<any>>();
    const res = ctx.getResponse<FastifyReply<any>>();
    const path = req.raw.url;
    const method = req.raw.method;
    const timestamp = new Date().toISOString();
    let statusCode;
    let httpError;

    const user = (req as any).user as User | Customer;
    let userInfo: string;
    if (user) {
      if ((user as User).login) {
        userInfo = `userLogin=${(user as User).login}`;
      } else {
        userInfo = `userId=${user.id}, userEmail=${(user as Customer).email}`;
      }
    }

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      httpError = exception.getResponse();
    } else if (this.isMongoDuplicationException(exception)) {
      statusCode = HttpStatus.BAD_REQUEST;
      httpError = { error: 'Bad Request', message: this.getMongoDuplicationMessage(exception) };

      this.logger.error({
        statusCode,
        message: exception.message,
        timestamp,
        method,
        ...(userInfo ? { userInfo } : {}),
        path
      });

    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const errorObj = {
        statusCode,
        message: exception.message,
        stack: exception.stack?.split('\n').map(str => str.trim()),
        timestamp,
        method,
        ...(userInfo ? { userInfo } : {}),
        path
      };
      this.logger.error(errorObj);
      this.internalServerError$.next(errorObj);
    }

    res.status(statusCode).send({
      ...(httpError ? httpError : {}),
      statusCode,
      timestamp,
      method,
      path
    });
  }

  private isMongoDuplicationException(exception: any) {
    return exception.code === 11000 || exception.code === 11001
  }

  private getMongoDuplicationMessage(exception: Error) {
    const collectionKeyValueRegex = exception.message.match(/collection: [^.]*\.(\S*).*key:\s+{\s+(.*):\s+(?:"(.*)"|(.*))\s+}/);
    if (collectionKeyValueRegex === null) {
      return 'Have duplicates, cannot save this data';
    }

    const collection = collectionKeyValueRegex[1] || '';
    const key = collectionKeyValueRegex[2] || '';
    const value = collectionKeyValueRegex[3] || collectionKeyValueRegex[4] || '';

    return `${key} with value '${value}' already exists in ${collection}`;
  }
}
