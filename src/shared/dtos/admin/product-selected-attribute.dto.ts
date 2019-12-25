import { Expose } from 'class-transformer';
import { Matches } from 'class-validator';
import { alphaNumDashUnderscoreRegex } from '../../contants';

export class AdminProductSelectedAttributeDto {
  @Expose()
  @Matches(alphaNumDashUnderscoreRegex)
  id: string;

  @Expose()
  @Matches(alphaNumDashUnderscoreRegex, { each: true })
  valueIds: string[];
}
