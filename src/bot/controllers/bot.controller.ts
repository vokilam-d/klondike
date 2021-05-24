import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BotConfigurationService } from '../services/bot-configuration.service';
import { ITelegramUpdate } from '../interfaces/telegram-update.interface';
import { IMonobankUpdate } from '../interfaces/monobank-update.interface';
import { MonobankConnector } from '../services/monobank.connector';

@Controller('bot')
export class BotController {

  constructor(
    private readonly botConfig: BotConfigurationService,
    private readonly monobankConnector: MonobankConnector
  ) { }

  @Post('tg-webhook')
  telegramWebhook(@Body() update: ITelegramUpdate) {
    if (update.message?.text?.startsWith('/')) {
      this.botConfig.onCommand(update.message.chat, update.message.text, update.message.from);
    }
  }

  @Get('mono-webhook')
  monobankWebhookGet(@Body() update: IMonobankUpdate, @Query() query: any): void {
    console.log('mono-webhook get body');
    console.dir(update, { depth: 10 });
    console.log('mono-webhook get query');
    console.dir(query, { depth: 10 });
    // this.monobankConnector.onUpdate(update);
  }

  @Post('mono-webhook')
  monobankWebhookPost(@Body() update: IMonobankUpdate): void {
    console.log('mono-webhook post body');
    console.dir(update, { depth: 10 });
    // this.monobankConnector.onUpdate(update);
  }
}
