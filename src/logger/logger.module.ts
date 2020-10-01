import { Global, Module } from '@nestjs/common';
import { FileLogger } from './file-logger.service';

@Global()
@Module({
  providers: [FileLogger],
  exports: [FileLogger]
})
export class LoggerModule {}
