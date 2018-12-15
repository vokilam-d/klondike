import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

const dist = join(process.cwd(), '..', '..', 'dist');

@Injectable()
export class AppService {
  getHello(req: Request, res: Response) {

    const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require(join(dist, 'web-server', 'main'));

    const timerLabel = `GET ${req.originalUrl}`;
    console.time(timerLabel);
    res.render(
      join(dist, 'web', 'index'),
      {
        req,
        res,
        bootstrap: AppServerModuleNgFactory,
        providers: [provideModuleMap(LAZY_MODULE_MAP)]
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
