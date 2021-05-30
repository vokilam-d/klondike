import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ITelegramUpdate } from '../interfaces/telegram-update.interface';
import { IMonobankUpdate } from '../interfaces/monobank-update.interface';
import { MonobankConnector } from '../services/monobank.connector';
import { BotService } from '../services/bot.service';

@Controller('bot')
export class BotController {

  constructor(
    private readonly botService: BotService,
    private readonly monobankConnector: MonobankConnector
  ) { }

  @Post('tg-webhook')
  telegramWebhook(@Body() update: ITelegramUpdate) {
    if (update.message?.text?.startsWith('/')) {
      this.botService.onCommand(update.message.chat, update.message.text, update.message.from);
    }
  }

  @Get('monobank-webhook')
  monobankWebhookGet(@Body() update: IMonobankUpdate, @Query() query: any): void {
    console.log('mono-webhook get');
  }

  @Post('monobank-webhook')
  @HttpCode(200)
  monobankWebhookPost(@Body() update: IMonobankUpdate): void {
    this.monobankConnector.onUpdate(update);
  }
}
