import { IsString } from 'class-validator';

export class AdminTrackingIdDto {
  @IsString()
  trackingId: string;
}
