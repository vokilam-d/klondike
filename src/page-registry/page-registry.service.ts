import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PageRegistry } from './models/page-registry.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { ClientSession, UpdateQuery } from 'mongoose';
import { __ } from '../shared/helpers/translate/translate.function';

@Injectable()
export class PageRegistryService {

  private logger = new Logger(PageRegistryService.name);

  constructor(@InjectModel(PageRegistry.name) private readonly registryModel: ReturnModelType<typeof PageRegistry>) {
  }

  getAllPages() {
    return this.registryModel.find();
  }

  async getPageType(slug: string): Promise<string> {
    const found = await this.registryModel.findOne({ slug });

    if (!found) {
      throw new NotFoundException(__('Page with url "$1" not found', 'ru', slug));
    }

    return found.type;
  }

  async createPageRegistry({ slug, type }, session: ClientSession): Promise<any> {
    const newPage = new this.registryModel({ slug, type });
    await newPage.save({ session });

    this.logger.log(`Created '${newPage.slug}' page-registry.`);
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
    } else {
      this.logger.error(`Could not update '${oldSlug}' in page-registry.`);
    }
    return result;
  }

  async deletePageRegistry(slug: PageRegistry['slug'], session: ClientSession) {
    const deleted = await this.registryModel.findOneAndDelete({ slug }).session(session).exec();

    if (deleted) {
      this.logger.log(`Deleted '${deleted.slug}' from page-registry.`);
    } else {
      this.logger.error(`Could not delete '${slug}' from page-registry.`);
    }

    return deleted;
  }
}
