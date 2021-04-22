import { IsString } from 'class-validator';

export class UpdateTrackingNumberDto {
  @IsString()
  trackingNumber: string;
}
