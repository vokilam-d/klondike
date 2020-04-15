import { HttpModule, Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './controller/city.controller';

@Module({
  imports: [
    HttpModule
  ],
  providers: [CityService],
  controllers: [CityController]
})
export class NovaPoshtaModule {
}
