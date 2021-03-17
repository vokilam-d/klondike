import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { BotData, BotDataModel } from '../models/bot-data.model';
import { BotDataType } from '../enums/bot-data-type.enum';
import { TelegramApiService } from './telegram-api.service';
import { CronProdPrimaryInstance } from '../../shared/decorators/primary-instance-cron.decorator';
import { CronExpression } from '@nestjs/schedule';
import { ITelegramUser } from '../interfaces/user.interface';
import { ITelegramChat } from '../interfaces/chat.interface';
import { BotCommand } from '../enums/bot-command.enum';
import { IBotCommand } from '../interfaces/bot-command.interface';
import { isProdPrimaryInstance } from '../../shared/helpers/is-prod-primary-instance.function';

@Injectable()
export class BotConfigurationService implements OnApplicationBootstrap {

  private logger = new Logger(BotConfigurationService.name);
  private _adminOrderChat: string | number | null = null;
  private _adminReviewsChat: string | number | null = null;
  private _adminHealthChat: string | number | null = null;
  private ownerIds: number[] = [];
  private bot: ITelegramUser | null = null;

  get adminOrderChat() { return this._adminOrderChat; }
  get adminReviewsChat() { return this._adminReviewsChat; }
  get adminHealthChat() { return this._adminHealthChat; }

  constructor(
    @InjectModel(BotData.name) private readonly botDataModel: ReturnModelType<typeof BotDataModel>,
    private readonly telegramApiService: TelegramApiService
  ) { }

  async onApplicationBootstrap() {
    this.getChats().then();
    this.getOwnerIds().then();
    this.getBotInfo().then();
    this.setCommands().then();
  }

  async onCommand(chat: ITelegramChat, commandText: string, user: ITelegramUser): Promise<void> {
    const indexOfBotMention = commandText.indexOf(`@${this.bot?.username}`);
    if (indexOfBotMention > -1) {
      commandText = commandText.slice(0, indexOfBotMention);
    }

    switch (commandText) {
      case BotCommand.SetAsAdminHealthChat:
        this.setAdminChat(chat, BotDataType.AdminHealthChat, user);
        break;
      case BotCommand.SetAsAdminReviewChat:
        this.setAdminChat(chat, BotDataType.AdminReviewsChat, user);
        break;
      case BotCommand.SetAsAdminOrderChat:
        this.setAdminChat(chat, BotDataType.AdminOrderChat, user);
        break;
    }
  }

  async setAdminChat(chat: ITelegramChat, chatType: BotDataType, user: ITelegramUser): Promise<void> {
    if (!this.ownerIds.includes(user.id)) {
      this.telegramApiService.sendMessage(chat.id, `[${user.first_name}](tg://user?id=${user.id}), мне кажется, вы не можете мной управлять :\\(`).then();
      return;
    }

    let message: string = null;
    switch (chatType) {
      case BotDataType.AdminHealthChat:
        this._adminHealthChat = chat.id;
        message = `Теперь ошибки будут приходить в этот чат`;
        break;
      case BotDataType.AdminOrderChat:
        this._adminOrderChat = chat.id;
        message = `Теперь оповещения о заказах будут приходить в этот чат`;
        break;
      case BotDataType.AdminReviewsChat:
        this._adminReviewsChat = chat.id;
        message = `Теперь оповещения об отзывах будут приходить в этот чат`;
        break;
      default:
        return;
    }

    const savedChat = await this.botDataModel.findOne({ type: chatType }).exec();
    if (savedChat) {
      savedChat.data = chat.id;
      await savedChat.save();
    } else {
      await this.botDataModel.create({
        type: chatType,
        data: chat.id
      });
    }

    this.logger.log(`Set ${chatType} to ${chat.id}, userId=${user.id}`);
    this.telegramApiService.sendMessage(chat.id, message).then();
  }

  private async getChats() {
    const data = await this.botDataModel.find().exec();
    for (const datum of data) {
      switch (datum.type) {
        case BotDataType.AdminHealthChat:
          this._adminHealthChat = datum.data;
          break;
        case BotDataType.AdminOrderChat:
          this._adminOrderChat = datum.data;
          break;
        case BotDataType.AdminReviewsChat:
          this._adminReviewsChat = datum.data;
          break;
        default:
          continue;
      }

      this.logger.log(`Set ${datum.type} to ${datum.data}`);
    }
  }

  @CronProdPrimaryInstance(CronExpression.EVERY_HOUR)
  private async getOwnerIds() {
    const savedOwnerIds = await this.botDataModel.findOne({ type: BotDataType.OwnerIds }).exec();
    if (savedOwnerIds) {
      this.ownerIds = savedOwnerIds.data;
      this.logger.log(`Set ${BotDataType.OwnerIds} to [${this.ownerIds}]`);
    }
  }

  private async getBotInfo() {
    const response = await this.telegramApiService.getBotInfo();
    if (response?.data?.result) {
      this.bot = response.data.result;
    } else {
      this.logger.error(`Could not get bot info:`);
      this.logger.error(response?.data);
    }
  }

  private async setCommands(): Promise<any> {
    if (!isProdPrimaryInstance()) {
      return;
    }

    const descriptions = {
      [BotCommand.SetAsAdminOrderChat]: 'Уведомлять о заказах',
      [BotCommand.SetAsAdminHealthChat]: 'Уведомлять об ошибках',
      [BotCommand.SetAsAdminReviewChat]: 'Уведомлять об отзывах',
    };

    const commandsList = Object.values(BotCommand);
    const commands: IBotCommand[] = commandsList.map(command => ({
      command,
      description: descriptions[command] || ''
    }));

    const response = await this.telegramApiService.setMyCommands(commands);
    if (response?.data?.result === true) {
      this.logger.log(`Set bot commands [${commandsList.join(', ')}]`);
    } else {
      this.logger.error(`Could not set bot commands:`);
      this.logger.error(response?.data);
    }
  }
}
