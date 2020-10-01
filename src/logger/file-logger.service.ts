import { Injectable, Logger, Scope } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';
import { isProdEnv } from '../shared/helpers/is-prod-env.function';

@Injectable({ scope: Scope.TRANSIENT })
export class FileLogger extends Logger {

  private writeStream: WriteStream;

  constructor(...args) {
    super(...args);
    this.createWriteStream();
  }

  log(message: any, context?: string) {
    this.writeToFile(message);

    super.log(message, context);
  }

  private createWriteStream() {
    if (!isProdEnv()) { return; }

    this.writeStream = createWriteStream(`/var/log/log.txt`, { flags: 'a' });
  }

  private writeToFile(message: string) {
    if (!this.writeStream) { return; }

    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    this.writeStream.write(`${date.toISOString()} - [${this.context}] ${message} \n`);
  }
}
