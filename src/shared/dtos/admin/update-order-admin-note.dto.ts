import { IsString } from 'class-validator';

export class UpdateOrderAdminNote {
  @IsString()
  note: string;
}
