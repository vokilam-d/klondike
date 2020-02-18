import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './models/category.model';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { ProductService } from '../product/product.service';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateCategoryDto, AdminCategoryTreeItem } from '../shared/dtos/admin/category.dto';
import { CounterService } from '../shared/counter/counter.service';
import { transliterate } from '../shared/helpers/transliterate.function';
import { plainToClass } from 'class-transformer';
import { ClientSession } from 'mongoose';

@Injectable()
export class CategoryService {

  constructor(@InjectModel(Category.name) private readonly categoryModel: ReturnModelType<typeof Category>,
              private pageRegistryService: PageRegistryService,
              private counterService: CounterService,
              private productService: ProductService) {
  }

  async getCategoriesTree(): Promise<AdminCategoryTreeItem[]> {
    const treeItems: AdminCategoryTreeItem[] = [];
    const childrenMap: { [parentId: number]: AdminCategoryTreeItem[] } = {};

    const found = await this.categoryModel.find().exec();
    found.forEach(category => {
      const item = {
        id: category.id,
        name: category.name,
        children: []
      };

      if (category.parentId === 0) {
        treeItems.push(item);
        return;
      }

      childrenMap[category.parentId] = childrenMap[category.parentId] || [];
      childrenMap[category.parentId].push(item);
    });

    const populateChildrenArray = (array: AdminCategoryTreeItem[]) => {
      array.forEach(arrayItem => {
        const children = childrenMap[arrayItem.id] || [];
        arrayItem.children.push(...children);

        populateChildrenArray(arrayItem.children);
      });
    };

    populateChildrenArray(treeItems);

    return treeItems;
  }

  async getCategoryById(id: string | number): Promise<DocumentType<Category>> {
    id = parseInt(id as string);

    const found = await this.categoryModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(`Category with id '${id}' not found`);
    }

    return found;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const found = await this.categoryModel.findOne({ slug }).exec();
    if (!found) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return found.toJSON();
  }

  async createCategory(category: AdminAddOrUpdateCategoryDto, migrate?: any): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const duplicate = await this.categoryModel.findOne({ slug: category.slug, parentId: category.parentId }).exec();
    if (duplicate) {
      throw new BadRequestException(`Category with slug '${category.slug}' already exists in parent with ID '${category.parentId}'`);
    }

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const newCategoryModel = new this.categoryModel(category);
      if (!migrate) {
        newCategoryModel.id = await this.counterService.getCounter(Category.collectionName, session);
      }

      await newCategoryModel.save({ session });
      this.createCategoryPageRegistry(newCategoryModel.slug, session);
      await session.commitTransaction();

      return plainToClass(Category, newCategoryModel.toJSON());
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async updateCategory(categoryId: string | number, category: AdminAddOrUpdateCategoryDto): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const found = await this.getCategoryById(categoryId);
    const oldSlug = found.slug;

      Object.keys(category).forEach(key => {
        if (category[key] !== undefined && key !== 'id') {
          found[key] = category[key];
        }
      });

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const saved = await found.save({ session });
      if (oldSlug !== category.slug) {
        this.updateCategoryPageRegistry(found.slug, category.slug, session);
      }
      await session.commitTransaction();

      return saved.toJSON();
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async deleteCategory(categoryId: number): Promise<DocumentType<Category>> {
    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const deleted = await this.categoryModel.findByIdAndDelete(categoryId).session(session).exec();
      if (deleted === null) {
        throw new NotFoundException(`Category with id '${categoryId}' not found`);
      }

      await this.productService.removeCategoryId(categoryId, session);
      await this.deleteCategoryPageRegistry(deleted.slug, session);
      await session.commitTransaction();

      return deleted.toJSON();
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      session.endSession();
    }
  }

  async getCategoryItems(categoryId: number) {
    const products = await this.productService.getProductsByCategoryId(categoryId);
    return products;
  }

  private createCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: 'category'
    }, session);
  }

  private updateCategoryPageRegistry(oldSlug: string, newSlug: string, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: 'category'
    }, session);
  }

  private deleteCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.deletePageRegistry(slug, session);
  }

  async updateCounter() {
    const lastCategory = await this.categoryModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Category.collectionName, lastCategory.id);
  }
}
