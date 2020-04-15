import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskModel } from './models/task.model';

const taskModel = {
  name: TaskModel.modelName,
  schema: TaskModel.schema,
  collection: Task.collectionName
};

@Module({
  imports: [MongooseModule.forFeature([taskModel])],
  providers: [TasksService]
})
export class TasksModule {}
