import { getModelForClass, prop } from '@typegoose/typegoose';
import { CronJob } from 'cron';

export class Task {

  @prop()
  _id: string;

  @prop()
  cronJob: any;

  static collectionName = 'task';
}

export const TaskModel = getModelForClass(Task, {
  schemaOptions: {
    toJSON: {
      virtuals: true
    },
    timestamps: true
  }
})
