import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class EncryptorService {

  private saltRounds = 10;

  validate(str: string, str2: string): Promise<boolean> {
    return compare(str, str2)
  }

  hash(str: string): Promise<string> {
    return hash(str, this.saltRounds);
  }
}
