import { Module } from '@nestjs/common';
import { BotController } from './controllers/bot.controller';
import { BotService } from './services/bot.service';

@Module({
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService]
})
export class BotModule {}
