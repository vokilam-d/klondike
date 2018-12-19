import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { SsrService } from '../ssr.service';
import { Request, Response } from 'express';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter<NotFoundException> {

  constructor(private readonly ssrService: SsrService) {
  }

  catch(exception: NotFoundException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (req.originalUrl.indexOf('/api/') === 0) {
      res.status(status).send(`Method ${req.originalUrl} not found`);
    } else {
      this.ssrService.renderPage(req, res);
    }

  }

}