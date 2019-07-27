import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PageRegistry } from './models/page-registry.model';
import { ModelType } from 'typegoose';
import { BaseService } from '../shared/base.service';
import { IPageRegistry } from '../../../shared/models/page-registry.interface';

@Injectable()
export class PageRegistryService extends BaseService<PageRegistry> {

  private logger = new Logger(PageRegistryService.name);

  constructor(@InjectModel(PageRegistry.modelName) _pageRegistryModel: ModelType<PageRegistry>) {
    super();
    this._model = _pageRegistryModel;
  }

  async getPageType(slug: string): Promise<string> {
    const found = await this.findOne({ slug: slug });

    if (!found) {
      throw new NotFoundException(`Page with url '${slug}' not found`);
    }

    return found.type;
  }

  async createPageRegistry(pageRegistry: IPageRegistry): Promise<any> {
    const page = await PageRegistry.createModel();
    page.slug = pageRegistry.slug;
    page.type = pageRegistry.type;

    const created = await this.create(page);

    this.logger.log(`Created '${created.slug}' page-registry!`);
    return created;
  }

  async updatePageRegistry(oldSlug: IPageRegistry['slug'], pageRegistry: IPageRegistry): Promise<any> {
    const result = await this._model.findOneAndUpdate(
      { slug: oldSlug },
      { slug: pageRegistry.slug, type: pageRegistry.type },
      { new: true }
    ).exec();

    this.logger.log(`Updated '${result.slug}' page-registry`);
    return result;
  }

  async deletePageRegistry(slug: IPageRegistry['slug']) {
    const deleted = await this._model.findOneAndDelete({ slug: slug }).exec();

    this.logger.log(`Deleted '${deleted.slug}' from page-registry`);
    return deleted;
  }
}