import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Breadcrumb } from '../../models/breadcrumb.model';

export abstract class BaseBreadcrumbDto implements Breadcrumb {
  @Expose()
  @IsNumber()
  id: number;

  abstract name: any;

  @Expose()
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  isEnabled: boolean;
}
