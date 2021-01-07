import { Injectable, Logger } from '@nestjs/common';
import * as pm2 from 'pm2';

interface IMessage {
  type: string;
  data: any;
  id: number;
  topic: string;
}

type Callback = (data: any) => void;

@Injectable()
export class EventsService {

  private logger = new Logger(EventsService.name);
  private workerIds: number[] = [];
  private callbacksMap: Map<string, Callback[]> = new Map();

  onApplicationBootstrap() {
    this.getWorkerIds();
    this.handleMessages();
  }

  emit(topic: string, data: any): void {
    const message: IMessage = {
      data,
      topic,
      id: 0,
      type: 'type'
    };

    for (const workerId of this.workerIds) {
      pm2.sendDataToProcessId(workerId, message, (err, _) => {
        if (err) {
          this.logger.error(`Could not send data to process id "${workerId}":`);
          this.logger.error(err);
          return;
        }
      });
    }
  }

  on(topic: string, callback: Callback): void {
    const callbacks = this.callbacksMap.get(topic) || [];
    callbacks.push(callback);

    this.callbacksMap.set(topic, callbacks);
  }

  private getWorkerIds() {
    pm2.list((err, processDescriptionList) => {
      if (err) {
        this.logger.error(`Could not list processes:`);
        this.logger.error(err);
        return;
      }

      for (const processDescription of processDescriptionList) {
        this.workerIds.push(processDescription.pm_id);
      }
    });
  }

  private handleMessages() {
    process.on('message', (message: IMessage) => {
      const callbacks = this.callbacksMap.get(message.topic) || [];

      for (const callback of callbacks) {
        callback(message.data);
      }
    });
  }
}
