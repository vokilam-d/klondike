import { Expose } from 'class-transformer';
import { Matches } from 'class-validator';
import { alphaNumDashUnderscoreRegex } from '../../constants';

export class AdminProductSelectedAttributeDto {
  @Expose()
  @Matches(alphaNumDashUnderscoreRegex)
  attributeId: string;

  @Expose()
  @Matches(alphaNumDashUnderscoreRegex)
  valueId: string;
}
