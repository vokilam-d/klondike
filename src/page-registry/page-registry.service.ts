import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PageRegistry } from './models/page-registry.model';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

@Injectable()
export class PageRegistryService {

  private logger = new Logger(PageRegistryService.name);

  constructor(@InjectModel(PageRegistry.name) private readonly registryModel: ReturnModelType<typeof PageRegistry>) {
  }

  getAllPages() {
    return this.registryModel.find();
  }

  async getPageType(slug: string): Promise<string> {
    const found = await this.registryModel.findOne({ slug: slug });

    if (!found) {
      throw new NotFoundException(`Page with url '${slug}' not found`);
    }

    return found.type;
  }

  async createPageRegistry(pageRegistry: PageRegistry): Promise<any> {
    const created = await this.registryModel.create({
      slug: pageRegistry.slug,
      type: pageRegistry.type
    });

    this.logger.log(`Created '${created.slug}' page-registry.`);
    return created;
  }

  async updatePageRegistry(oldSlug: PageRegistry['slug'], pageRegistry: PageRegistry): Promise<any> {
    const result = await this.registryModel.findOneAndUpdate(
      { slug: oldSlug },
      { slug: pageRegistry.slug, type: pageRegistry.type },
      { new: true }
    ).exec();

    this.logger.log(`Updated '${result.slug}' page-registry.`);
    return result;
  }

  async deletePageRegistry(slug: PageRegistry['slug']) {
    const deleted = await this.registryModel.findOneAndDelete({ slug: slug }).exec();

    this.logger.log(`Deleted '${deleted.slug}' from page-registry.`);
    return deleted;
  }
}
