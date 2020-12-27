import { Expose, Type } from 'class-transformer';
import { BaseBreadcrumbDto } from '../shared-dtos/base-breadcrumb.dto';
import { MultilingualTextDto } from '../shared-dtos/multilingual-text.dto';

export class AdminBreadcrumbDto extends BaseBreadcrumbDto {
  @Expose()
  @Type(() => MultilingualTextDto)
  name: MultilingualTextDto;
}
