import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { PageRegistry } from './models/page-registry.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ClientSession, UpdateQuery } from 'mongoose';
import { __ } from '../shared/helpers/translate/translate.function';
import { CronExpression } from '@nestjs/schedule';
import { EventsService } from '../shared/services/events/events.service';
import { Language } from '../shared/enums/language.enum';
import { CronProd } from '../shared/decorators/prod-cron.decorator';
import { MaintenanceService } from '../maintenance/maintenance.service';

@Injectable()
export class PageRegistryService implements OnApplicationBootstrap {

  private logger = new Logger(PageRegistryService.name);
  private cachedPages: PageRegistry[] = [];
  private pagesUpdatedEventName: string = 'pages-updated';

  constructor(
    @InjectModel(PageRegistry.name) private readonly registryModel: ReturnModelType<typeof PageRegistry>,
    private readonly maintenanceService: MaintenanceService,
    private readonly eventsService: EventsService
  ) { }

  onApplicationBootstrap(): any {
    this.handleCachedPages();
  }

  async getAllPages(): Promise<PageRegistry[]> {
    if (this.cachedPages.length) {
      return this.cachedPages;
    }

    return this.registryModel.find();
  }

  async getPageType(slug: string, lang: Language): Promise<string> {
    const found = await this.registryModel.findOne({ slug });

    if (!found) {
      throw new NotFoundException(__('Page with url "$1" not found', lang, slug));
    }

    return found.type;
  }

  async createPageRegistry({ slug, type }, session: ClientSession): Promise<any> {
    const newPage = new this.registryModel({ slug, type });
    await newPage.save({ session });

    this.logger.log(`Created '${newPage.slug}' page-registry.`);
    this.onPagesUpdate();
    return newPage;
  }

  async updatePageRegistry({ oldSlug, newSlug, type, createRedirect }, session: ClientSession): Promise<any> {
    let updateQuery: UpdateQuery<PageRegistry>;
    let logMessage: string;

    if (createRedirect) {
      await this.createPageRegistry({ slug: newSlug, type }, session);

      updateQuery = { redirectSlug: newSlug, type };
      logMessage = `Created redirect "${oldSlug}" -> "${newSlug}" in page-registry.`;
    } else {
      updateQuery = { slug: newSlug, type };
      logMessage = `Updated "${oldSlug}" -> "${newSlug}" in page-registry.`;
    }

    const result = await this.registryModel.findOneAndUpdate(
      { slug: oldSlug },
      updateQuery,
      { new: true }
    ).session(session).exec();

    if (result) {
      this.logger.log(logMessage);
      this.onPagesUpdate();
    } else {
      this.logger.error(`Could not update '${oldSlug}' in page-registry.`);
    }
    return result;
  }

  async deletePageRegistry(slug: PageRegistry['slug'], session: ClientSession) {
    const deleted = await this.registryModel.findOneAndDelete({ slug }).session(session).exec();

    if (deleted) {
      this.logger.log(`Deleted '${deleted.slug}' from page-registry.`);
      this.onPagesUpdate();
    } else {
      this.logger.error(`Could not delete '${slug}' from page-registry.`);
    }

    return deleted;
  }

  @CronProd(CronExpression.EVERY_30_SECONDS)
  private async updateCachedPages() {
    if (this.maintenanceService.getMaintenanceInfo().isMaintenanceInProgress) {
      return;
    }

    try {
      const pages = await this.registryModel.find().exec();
      this.cachedPages = pages.map(page => page.toJSON());
    } catch (e) {
      this.logger.error(`Could not update cached pages:`);
      this.logger.error(e);
    }
  }

  private handleCachedPages() {
    this.updateCachedPages().then();

    this.eventsService.on(this.pagesUpdatedEventName, () => {
      this.updateCachedPages().then();
    });
  }

  private onPagesUpdate() {
    this.eventsService.emit(this.pagesUpdatedEventName, {});
  }
}
