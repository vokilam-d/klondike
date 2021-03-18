import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './models/task.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { CronJob } from 'cron';
import { Order } from '../order/models/order.model';
import { EmailService } from '../email/email.service';
import { TaskTypeEnum } from '../shared/enums/task-type.enum';
import { isProdPrimaryInstance } from '../shared/helpers/is-prod-primary-instance.function';
import { Language } from '../shared/enums/language.enum';
import { Subject } from 'rxjs';

@Injectable()
export class TasksService implements OnApplicationBootstrap {

  private logger = new Logger(TasksService.name);
  private readonly delaysInDays: { [t in TaskTypeEnum]?: number; } = {
    [TaskTypeEnum.SendEmail]: 14
  };

  leaveReviewRequested$ = new Subject<{ order: Order, lang: Language }>();

  constructor(@InjectModel(Task.name) private readonly taskModel: ReturnModelType<typeof Task>,
              // private readonly emailService: EmailService,
              private readonly scheduler: SchedulerRegistry) {
  }

  onApplicationBootstrap() {
    if (isProdPrimaryInstance()) {
      this.setupSavedTasks();
    }
  }

  async sendLeaveReviewEmail(order: Order, lang: Language) {
    const name = `${TaskTypeEnum.SendEmail}-${order._id}-${Date.now()}`;
    const time = new Date();
    time.setDate(time.getDate() + this.delaysInDays[TaskTypeEnum.SendEmail]);

    await this.addTask(name, time, TaskTypeEnum.SendEmail, [order, lang]);
  }

  private async setupSavedTasks() {
    const taskModels = await this.taskModel.find().exec();
    for (const taskModel of taskModels) {
      if (new Date() > taskModel.time) {
        this.logger.error(`Could not setup saved task ${taskModel.name}: time is expired. Removing from DB...`);
        await taskModel.remove();
        continue;
      }
      await this.startJob(taskModel.name, taskModel.time, taskModel.type, taskModel.arguments);
    }
  }

  private async addTask(name: string, time: Date, taskType: TaskTypeEnum, args: any[] = []) {
    await this.startJob(name, time, taskType, args);
    const newTask: Task = { name, time, type: taskType, arguments: args };
    await this.taskModel.create(newTask);
  }

  private startJob(name: string, time: Date, taskType: TaskTypeEnum, args: any[]) {
    const job = this.buildJob(taskType, args);
    const onComplete = () => {
      this.scheduler.deleteCronJob(name);
      this.taskModel.findOneAndDelete({ name }).exec();
    };

    const onTick = () => {
      job();
      onComplete();
    };

    const cronJob = new CronJob(time, onTick);
    this.scheduler.addCronJob(name, cronJob);
    cronJob.start();
  }

  private buildJob(taskType: TaskTypeEnum, args: any[]): () => any {
    switch (taskType) {
      case TaskTypeEnum.SendEmail:
        // return () => this.emailService.sendLeaveReviewEmail(args[0], args[1]);
        return () => this.leaveReviewRequested$.next({ order: args[0], lang: args[1] });
    }
  }
}
