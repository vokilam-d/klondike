import { Cron, CronExpression } from '@nestjs/schedule';
import { CronOptions } from '@nestjs/schedule/dist/decorators/cron.decorator';

export const PrimaryInstanceCron = (cronTime: string | Date | CronExpression, options?: CronOptions) => {
  const instanceId = process.env.INSTANCE_ID;

  if (instanceId === undefined || instanceId === '0') {
    return Cron(cronTime, options);
  } else {
    return () => {};
  };
};
