import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddOrUpdateStoreReviewDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  text: string;

  @Expose()
  @IsString()
  email: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  customerId: number;

  @Expose()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class StoreReviewDto {
  @Expose()
  id: number;

  @Expose()
  votesCount: number;

  @Expose()
  isVoted: boolean;
}
