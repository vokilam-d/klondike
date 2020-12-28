import { Injectable, Logger, Scope } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';
import { isProdEnv } from '../shared/helpers/is-prod-env.function';

@Injectable({ scope: Scope.DEFAULT })
export class FileLogger extends Logger {

  private writeStream: WriteStream;

  constructor(...args) {
    super(...args);
    this.createWriteStream();
  }

  log(message: any, context?: string) {
    this.writeToFile(message, 'log');
    super.log(message, context);
  }

  error(message: any, context?: string) {
    this.writeToFile(message, 'error');
    super.error(message, context);
  }

  warn(message: any, context?: string) {
    this.writeToFile(message, 'warn');
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    this.writeToFile(message, 'debug');
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.writeToFile(message, 'verbose');
    super.verbose(message, context);
  }

  private createWriteStream() {
    if (!isProdEnv()) { return; }

    this.writeStream = createWriteStream(`/var/log/log.txt`, { flags: 'a' });
  }

  private writeToFile(message: string, type: 'log' | 'error' | 'warn' | 'debug' | 'verbose') {
    if (!this.writeStream) { return; }

    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    this.writeStream.write(`${date.toISOString()} - [${type.toUpperCase()}] - [${this.context}] ${message} \n`);
  }
}
