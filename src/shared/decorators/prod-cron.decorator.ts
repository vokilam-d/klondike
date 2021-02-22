import { Cron, CronExpression } from '@nestjs/schedule';
import { CronOptions } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { isProdEnv } from '../helpers/is-prod-env.function';

export const CronProd = (cronTime: string | Date | CronExpression, options?: CronOptions) => {
  if (isProdEnv()) {
    return Cron(cronTime, options);
  } else {
    return () => {};
  }
};
