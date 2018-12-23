import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { MapperService } from './mapper/mapper.service';

@Global()
@Module({
  providers: [ConfigService, MapperService],
  exports: [ConfigService, MapperService]
})
export class SharedModule {}
