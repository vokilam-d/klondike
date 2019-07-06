import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PageRegistry } from './models/page-registry.model';
import { ModelType } from 'typegoose';
import { BaseService } from '../shared/base.service';
import { IPageRegistry } from '../../../shared/models/page-registry.interface';

@Injectable()
export class PageRegistryService extends BaseService<PageRegistry> {

  constructor(@InjectModel(PageRegistry.modelName) _pageRegistryModel: ModelType<PageRegistry>) {
    super();
    this._model = _pageRegistryModel;
  }

  async getPageType(slug: string): Promise<boolean> {
    let found;
    try {
      found = await this.findOne({ slug: slug });
    } catch (ex) {
      throw new HttpException(ex, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!found) {
      throw new HttpException(`Page with url '${slug}' not found`, HttpStatus.NOT_FOUND);
    }

    return found.type;
  }

  async createPageRegistry(pageRegistry: IPageRegistry): Promise<any> {
    const page = await PageRegistry.createModel();
    page.slug = pageRegistry.slug;
    page.type = pageRegistry.type;

    try {
      const created = await this.create(page);

      if (!created) {
        return;
      }

      console.log(`Created '${created.slug}' page-registry!`);
      return created;

    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePageRegistry(oldSlug: IPageRegistry['slug'], pageRegistry: IPageRegistry): Promise<any> {
    try {
      const result = await this._model.findOneAndUpdate(
        { slug: oldSlug },
        { slug: pageRegistry.slug, type: pageRegistry.type },
        { new: true }
      ).exec();

      if (!result) {
        return;
      }

      console.log(`Updated '${result.slug}' page-registry`);
      return result;

    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deletePageRegistry(slug: IPageRegistry['slug']) {
    try {
      const deleted = await this._model.findOneAndDelete({ slug: slug }).exec();

      if (!deleted) {
        return;
      }

      console.log(`Deleted '${deleted.slug}' from page-registry`);
      return deleted;
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}