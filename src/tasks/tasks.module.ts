import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskModel } from './models/task.model';
import { EmailModule } from '../email/email.module';

const taskModel = {
  name: TaskModel.modelName,
  schema: TaskModel.schema,
  collection: Task.collectionName
};

@Module({
  imports: [
    MongooseModule.forFeature([taskModel]),
    EmailModule
  ],
  providers: [
    TasksService
  ],
  exports: [
    TasksService
  ]
})
export class TasksModule {}
