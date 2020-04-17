import { arrayProp, getModelForClass, prop } from '@typegoose/typegoose';
import { ETaskType } from '../../shared/enums/task-type.enum';

export class Task {

  @prop()
  name: string;

  @prop({ enum: ETaskType })
  type: ETaskType;

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
