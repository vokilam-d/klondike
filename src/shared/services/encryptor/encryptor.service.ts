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

  async hash(str: string, algorith?: 'md5' | 'sha1'): Promise<string> {
    if (algorith) {
      return createHash(algorith).update(str).digest('hex');
    } else {
      return hash(str, this.saltRounds);
    }
  }
}
