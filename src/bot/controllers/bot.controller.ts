import { Body, Controller, Post } from '@nestjs/common';
import { BotConfigurationService } from '../services/bot-configuration.service';
import { ITelegramUpdate } from '../interfaces/update.interface';

@Controller('bot')
export class BotController {

  constructor(
    private readonly botConfig: BotConfigurationService
  ) { }

  @Post('tg-webhook')
  webhook(@Body() update: ITelegramUpdate) {
    console.log(update);
    if (!update.message) {
      return;
    }

    if (update.message.text.startsWith('/')) {
      this.botConfig.onCommand(update.message.chat, update.message.text, update.message.from);
    }
  }
}
