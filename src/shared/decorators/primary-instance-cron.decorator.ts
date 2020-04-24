import { Cron, CronExpression } from '@nestjs/schedule';
import { CronOptions } from '@nestjs/schedule/dist/decorators/cron.decorator';
import { isProdEnv } from '../helpers/is-prod-env.function';

export const ProdPrimaryInstanceCron = (cronTime: string | Date | CronExpression, options?: CronOptions) => {
  const instanceId = process.env.INSTANCE_ID;

  if (isProdEnv() && (instanceId === undefined || instanceId === '0')) {
    return Cron(cronTime, options);
  } else {
    return () => {};
  };
};
