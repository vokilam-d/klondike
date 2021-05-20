import { Body, Controller, Post, Request } from '@nestjs/common';
import { BotConfigurationService } from '../services/bot-configuration.service';
import { ITelegramUpdate } from '../interfaces/update.interface';
import { FastifyRequest } from 'fastify';
import { BotService } from '../services/bot.service';
import { ResponseDto } from '../../shared/dtos/shared-dtos/response.dto';

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

  @Post('payment-media')
  async uploadMedia(@Request() request: FastifyRequest): Promise<ResponseDto<true>> {
    await this.botService.onNewPayment(request);

    return {
      data: true
    };
  }
}
