import { Cron, CronExpression } from '@nestjs/schedule';
import { CronOptions } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { isProdPrimaryInstance } from '../helpers/is-prod-primary-instance.function';

export const CronProdPrimaryInstance = (cronTime: string | Date | CronExpression, options?: CronOptions) => {
  if (isProdPrimaryInstance()) {
    return Cron(cronTime, options);
  } else {
    return () => {};
  }
};
