import { HttpModule, Module } from '@nestjs/common';
import { BotController } from './controllers/bot.controller';
import { BotService } from './services/bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BotData, BotDataModel } from './models/bot-data.model';
import { TelegramApiService } from './services/telegram-api.service';
import { BotConfigurationService } from './services/bot-configuration.service';
import { MonobankConnector } from './services/monobank.connector';
import { PrivatbankConnector } from './services/privatbank.connector';

const botDataModel = {
  name: BotDataModel.modelName,
  schema: BotDataModel.schema,
  collection: BotData.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([botDataModel]),
    HttpModule
  ],
  controllers: [BotController],
  providers: [BotService, BotConfigurationService, TelegramApiService, MonobankConnector, PrivatbankConnector],
  exports: [BotService, MonobankConnector, PrivatbankConnector]
})
export class BotModule {}
