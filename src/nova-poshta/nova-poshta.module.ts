import { HttpModule, Module } from '@nestjs/common';
import { NovaPoshtaService } from './nova-poshta.service';
import { CityController } from './controller/city.controller';

@Module({
  imports: [
    HttpModule
  ],
  providers: [NovaPoshtaService],
  controllers: [CityController]
})
export class NovaPoshtaModule {
}
