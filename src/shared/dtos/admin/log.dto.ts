import { Log } from '../../models/log.model';
import { Expose, Type } from 'class-transformer';

export class AdminLogDto implements Log {
  @Expose()
  text: string;

  @Expose()
  @Type(() => Date)
  time: Date;
}
