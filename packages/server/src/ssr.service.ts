import { Injectable } from '@nestjs/common';
import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import { join } from 'path';
import { Request, Response } from 'express';

const dist = join(process.cwd(), '..', '..', 'dist');

@Injectable()
export class SsrService {
  renderPage(req: Request, res: Response) {
    console.log('server render page!');

    const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require(join(dist, 'web-server', 'main'));

    const timerLabel = `GET ${req.originalUrl}`;

    console.time(timerLabel);
    res.render(
      join('web', 'index'),
      {
        req,
        res,
        bootstrap: AppServerModuleNgFactory,
        providers: [
          provideModuleMap(LAZY_MODULE_MAP),
          {
            provide: REQUEST,
            useValue: req
          }, {
            provide: RESPONSE,
            useValue: res
          }
        ]
      },
      (err, html) => {
        console.timeEnd(timerLabel);

        if (err) {
          throw err;
        }

        res.send(html);
      }
    );

  }
}
