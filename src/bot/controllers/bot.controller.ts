import { Body, Controller, Post } from '@nestjs/common';
import { BotConfigurationService } from '../services/bot-configuration.service';
import { ITelegramUpdate } from '../interfaces/update.interface';
import { BotService } from '../services/bot.service';

@Controller('bot')
export class BotController {

  constructor(
    private readonly botConfig: BotConfigurationService,
    private readonly botService: BotService
  ) { }

  @Post('tg-webhook')
  webhook(@Body() update: ITelegramUpdate) {
    if (update.message?.text?.startsWith('/')) {
      this.botConfig.onCommand(update.message.chat, update.message.text, update.message.from);
    }
  }
}
