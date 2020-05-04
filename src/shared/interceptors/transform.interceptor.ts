import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classToPlain } from 'class-transformer';
import { isObject } from '../helpers/is-object.function';

export class TransformInterceptor implements NestInterceptor { // not using
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(res => (isObject(res) ? this.transformResponse(res) : res))
    );
  }

  transformResponse(response) {
    if (Array.isArray(response)) {
      return response.map(item => this.transformToPlain(item));
    }
    return this.transformToPlain(response);
  }

  transformToPlain(plainOrClass) {
    return plainOrClass && plainOrClass.constructor !== Object
      ? classToPlain(plainOrClass)
      : plainOrClass;
  }
}
