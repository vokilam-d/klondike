import { Expose } from 'class-transformer';
import { BaseBreadcrumbDto } from '../shared-dtos/base-breadcrumb.dto';
import { Breadcrumb } from '../../models/breadcrumb.model';
import { Language } from '../../enums/language.enum';

export class ClientBreadcrumbDto extends BaseBreadcrumbDto {
  @Expose()
  name: string;

  static transformTodo(breadcrumb: Breadcrumb, lang: Language): ClientBreadcrumbDto {
    return {
      id: breadcrumb.id,
      isEnabled: false,
      name: '',
      slug: ''
    };
  }
}
