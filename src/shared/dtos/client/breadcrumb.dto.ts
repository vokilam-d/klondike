import { Expose } from 'class-transformer';
import { BaseBreadcrumbDto } from '../shared-dtos/base-breadcrumb.dto';

export class ClientBreadcrumbDto extends BaseBreadcrumbDto {
  @Expose()
  name: string;
}
