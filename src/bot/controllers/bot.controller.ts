import { Body, Controller, Post } from '@nestjs/common';
import { BotService } from '../services/bot.service';

@Controller('bot')
export class BotController {

  constructor(
    private readonly botService: BotService
  ) { }

  @Post('webhook')
  webhook(@Body() update: any) {
    console.log(update);
  }
}
