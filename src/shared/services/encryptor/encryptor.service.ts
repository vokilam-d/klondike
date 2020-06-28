import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { createHash } from 'crypto';

@Injectable()
export class EncryptorService {

  private saltRounds = 10;

  validate(str: string, str2: string): Promise<boolean> {
    return compare(str, str2)
  }

  validateBySha256(strToHash: string, hashedStr1: string): boolean {
    const hashedStr2 = createHash('sha256').update(strToHash).digest('hex');

    return hashedStr2 === hashedStr1;
  }

  hash(str: string): Promise<string> {
    return hash(str, this.saltRounds);
  }
}
