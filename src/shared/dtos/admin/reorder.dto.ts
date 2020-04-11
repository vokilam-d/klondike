import { EReorderPosition } from '../../enums/reoder-position.enum';
import { IsDefined, IsEnum, IsNumber } from 'class-validator';

export class ReorderDto {
  @IsDefined()
  id: any;

  @IsDefined()
  targetId: any;

  @IsEnum(EReorderPosition)
  position: EReorderPosition;
}

export class ProductReorderDto extends ReorderDto {
  @IsNumber()
  categoryId: number;
}
