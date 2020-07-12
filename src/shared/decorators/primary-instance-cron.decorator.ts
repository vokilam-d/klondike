import { Cron, CronExpression } from '@nestjs/schedule';
import { CronOptions } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { isPropPrimaryInstance } from '../helpers/is-prod-primary-instance.function';

export const CronProdPrimaryInstance = (cronTime: string | Date | CronExpression, options?: CronOptions) => {
  if (isPropPrimaryInstance()) {
    return Cron(cronTime, options);
  } else {
    return () => {};
  }
};
