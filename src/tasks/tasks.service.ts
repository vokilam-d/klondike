import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './models/task.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { CronJob } from 'cron';

@Injectable()
export class TasksService implements OnApplicationBootstrap {

  constructor(@InjectModel(Task.name) private readonly taskModel: ReturnModelType<typeof Task>,
              private readonly scheduler: SchedulerRegistry) {
  }

  async onApplicationBootstrap() {
    // await this.setupSavedTasks();

    // setTimeout(() => {
    //   this.addTask('testTask2', new Date(Date.now() + 20 * 1000), () => console.log('my task2!'));
    // }, 200);
  }

  private async setupSavedTasks() {
    const taskModels = await this.taskModel.find().exec();
    for (const taskModel of taskModels) {
      // await this.saveAndInitCronJob(taskModel._id, taskModel.cronJob);
    }
  }

  async addTask(name: string, time: Date, job: Function) {
    const onComplete = () => {
      this.scheduler.deleteCronJob(name);
      this.taskModel.findByIdAndDelete(name);
    };

    const onTick = () => {
      job();
      onComplete();
    };

    const cronJob = new CronJob(time, onTick);
    this.scheduler.addCronJob(name, cronJob);
    cronJob.start();

    const newTask: Task = { _id: name, cronJob: job }
    await this.taskModel.create(newTask);
  }

  private async saveAndInitCronJob(name: string, cronJob: CronJob) {
  }
}
