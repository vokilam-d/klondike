import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { TaskTypeEnum } from '../../shared/enums/task-type.enum';

export class Task {

  @prop()
  name: string;

  @prop({ enum: TaskTypeEnum })
  type: TaskTypeEnum;

  @arrayProp({ default: [], items: Object })
  arguments: any[];

  @prop()
  time: Date;

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
