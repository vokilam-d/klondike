import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { AdminMediaDto } from './media.dto';
import { TrimString } from '../../decorators/trim-string.decorator';

export class AdminBaseReviewDto {
  @Expose()
  @Transform(((value, obj) => obj._id || value))
  id?: number;

  @Expose()
  @IsBoolean()
  isEnabled?: boolean;

  @Expose()
  @IsOptional()
  votesCount?: number;

  @Expose()
  @IsOptional()
  hasClientVoted?: boolean;

  @Expose()
  @IsString()
  @TrimString()
  name: string;

  @Expose()
  @IsString()
  @TrimString()
  text: string;

  @Expose()
  @IsString()
  @TrimString()
  email: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @Expose()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaDto)
  medias: AdminMediaDto[];

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;
}
