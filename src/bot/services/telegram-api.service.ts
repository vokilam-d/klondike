import { HttpService, Injectable, Logger } from '@nestjs/common';
import { ITelegramInlineKeyboardMarkup } from '../interfaces/inline-keyboard-markup.interface';
import { ITelegramReplyKeyboardMarkup } from '../interfaces/reply-keyboard-markup.interface';
import { ITelegramReplyKeyboardRemove } from '../interfaces/reply-keyboard-remove.interface';
import { IBotCommand } from '../interfaces/bot-command.interface';
import { ISetBotCommands } from '../interfaces/set-bot-commands.interface';

export type ReplyMarkup = ITelegramInlineKeyboardMarkup | ITelegramReplyKeyboardMarkup | ITelegramReplyKeyboardRemove;

@Injectable()
export class TelegramApiService {

  private readonly apiHost = `https://api.telegram.org`;
  private readonly token = process.env.TELEGRAM_BOT_TOKEN;

  private readonly logger = new Logger(TelegramApiService.name);

  constructor(
    private readonly http: HttpService
  ) { }

  sendMessage(chatId: string | number, text: string, reply?: ReplyMarkup): Promise<any> {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'MarkdownV2',
      ...(reply ? { reply_markup: reply } : {})
    };

    return this.execMethod('sendMessage', payload);
  }

  setMyCommands(commands: IBotCommand[]): Promise<any> {
    const payload: ISetBotCommands = {
      commands
    };

    return this.execMethod('setMyCommands', payload);
  }

  getBotInfo(): Promise<any> {
    return this.execMethod('getMe', { });
  }

  private async execMethod(methodName: string, data: any): Promise<any> {
    const url = `${this.apiHost}/bot${this.token}/${methodName}`;
    try {
      const response = await this.http.post(url, data).toPromise();
      if (response.data?.ok !== true) {
        this.logger.error(`Method "${methodName}" failed:`)
        this.logger.error({ request: data, response: response.data });
      } else {
        this.logger.log(`Method "${methodName}" sucess:`)
        this.logger.log({ request: data, response: response.data });

      }
    } catch (error) {
      this.logger.error(`Method "${methodName}" failed:`)
      this.logger.error({ config: error.config, error: error.response?.data || error.response || error });
    }
  }
}
