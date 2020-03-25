import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class EncryptorService {

  private saltRounds = 10;

  validatePassword(password: string, password2: any): Promise<boolean> {
    return compare(password, password2)
  }

  hashPassword(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }
}
