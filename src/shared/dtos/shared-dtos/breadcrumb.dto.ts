import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { TrimString } from '../../decorators/trim-string.decorator';
import { Breadcrumb } from '../../models/breadcrumb.model';

export class BreadcrumbDto implements Breadcrumb {
  @Expose()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  slug: string;

  @Expose()
  isEnabled: boolean;
}
