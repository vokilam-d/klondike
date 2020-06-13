import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './models/category.model';
import { PageRegistryService } from '../page-registry/page-registry.service';
import { ProductService } from '../product/product.service';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AdminAddOrUpdateCategoryDto } from '../shared/dtos/admin/category.dto';
import { CounterService } from '../shared/services/counter/counter.service';
import { transliterate } from '../shared/helpers/transliterate.function';
import { plainToClass } from 'class-transformer';
import { ClientSession } from 'mongoose';
import { CategoryTreeItem } from '../shared/dtos/shared-dtos/category.dto';
import { Breadcrumb } from '../shared/models/breadcrumb.model';
import { ReorderPositionEnum } from '../shared/enums/reoder-position.enum';
import { __ } from '../shared/helpers/translate/translate.function';
import { PageTypeEnum } from '../shared/enums/page-type.enum';

@Injectable()
export class CategoryService {

  constructor(@InjectModel(Category.name) private readonly categoryModel: ReturnModelType<typeof Category>,
              private pageRegistryService: PageRegistryService,
              private counterService: CounterService,
              @Inject(forwardRef(() => ProductService)) private productService: ProductService) {
  }

  async getAllCategories(): Promise<Category[]> {
    let categories = await this.categoryModel.find().exec();
    categories = categories
      .sort((a, b) => a.reversedSortOrder - b.reversedSortOrder)
      .map(cat => cat.toJSON());

    return categories;
  }

  async getCategoriesTree(): Promise<CategoryTreeItem[]> {
    const treeItems: CategoryTreeItem[] = [];
    const childrenMap: { [parentId: number]: CategoryTreeItem[] } = {};

    const found = await this.categoryModel.find().exec();
    found.forEach(category => {
      const item: CategoryTreeItem = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        reversedSortOrder: category.reversedSortOrder,
        children: []
      };

      if (category.parentId === 0) {
        treeItems.push(item);
        return;
      }

      childrenMap[category.parentId] = childrenMap[category.parentId] || [];
      childrenMap[category.parentId].push(item);
    });

    const populateChildrenArray = (array: CategoryTreeItem[]) => {
      array.forEach(arrayItem => {
        const children = childrenMap[arrayItem.id] || [];
        arrayItem.children.push(...children);

        populateChildrenArray(arrayItem.children);
      });

      array.sort((a, b) => a.reversedSortOrder - b.reversedSortOrder);
    };

    populateChildrenArray(treeItems);

    return treeItems;
  }

  async getCategoryById(id: string | number): Promise<DocumentType<Category>> {
    id = parseInt(id as string);

    const found = await this.categoryModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException(__('Category with id "$1" not found', 'ru', id));
    }

    return found;
  }

  async getCategoryBySlug(slug: string): Promise<Category> { // todo cache
    const found = await this.categoryModel.findOne({ slug }).exec();
    if (!found) {
      throw new NotFoundException(__('Category with slug "$1" not found', 'ru', slug));
    }

    return found.toJSON();
  }

  async createCategory(category: AdminAddOrUpdateCategoryDto, migrate?: any): Promise<Category> {
    category.slug = category.slug === '' ? transliterate(category.name) : category.slug;

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      const newCategoryModel = new this.categoryModel(category);
      if (!migrate) {
        newCategoryModel.id = await this.counterService.getCounter(Category.collectionName, session);
      }

      const lastSiblingOrder = await this.getLastSiblingOrder(category.parentId);
      if (lastSiblingOrder) {
        newCategoryModel.reversedSortOrder = lastSiblingOrder + 1;
      }

      newCategoryModel.breadcrumbs = await this.buildBreadcrumbs(newCategoryModel);
      await newCategoryModel.save({ session });
      await this.createCategoryPageRegistry(newCategoryModel.slug, session);
      await session.commitTransaction();

      return plainToClass(Category, newCategoryModel.toJSON());
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  async updateCategory(categoryId: number, categoryDto: AdminAddOrUpdateCategoryDto): Promise<Category> {
    categoryDto.slug = categoryDto.slug === '' ? transliterate(categoryDto.name) : categoryDto.slug;

    const found = await this.getCategoryById(categoryId);
    const oldSlug = found.slug;
    const oldName = found.name;

    Object.keys(categoryDto).forEach(key => {
      if (categoryDto[key] !== undefined && key !== 'id') {
        found[key] = categoryDto[key];
      }
    });

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {
      if (found.parentId !== categoryDto.parentId) {
        found.breadcrumbs = await this.buildBreadcrumbs(found);
      }
      if (oldSlug !== categoryDto.slug) {
        await this.updateCategoryPageRegistry(oldSlug, categoryDto.slug, session);
      }
      if (oldSlug !== categoryDto.slug || oldName !== categoryDto.name) {
        await this.productService.updateProductCategory(categoryId, categoryDto.name, categoryDto.slug, session);
      }

      const saved = await found.save({ session });
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
        throw new NotFoundException(__('Category with id "$1" not found', 'ru', categoryId));
      }

      const parentIdProp: keyof Category = 'parentId';
      await this.categoryModel
        .updateMany({ parentId: deleted._id }, { [parentIdProp]: deleted.parentId })
        .session(session)
        .exec();

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

  private createCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.createPageRegistry({
      slug,
      type: PageTypeEnum.Category
    }, session);
  }

  private updateCategoryPageRegistry(oldSlug: string, newSlug: string, session: ClientSession) {
    return this.pageRegistryService.updatePageRegistry(oldSlug, {
      slug: newSlug,
      type: PageTypeEnum.Category
    }, session);
  }

  private deleteCategoryPageRegistry(slug: string, session: ClientSession) {
    return this.pageRegistryService.deletePageRegistry(slug, session);
  }

  async updateCounter() {
    const lastCategory = await this.categoryModel.findOne().sort('-_id').exec();
    return this.counterService.setCounter(Category.collectionName, lastCategory.id);
  }

  async clearCollection() {
    await this.categoryModel.deleteMany({}).exec();
  }

  private async buildBreadcrumbs(category: Category, allCategories?: Category[]): Promise<Breadcrumb[]> {
    if (!category.parentId) { return []; }

    if (!allCategories) {
      allCategories = await this.getAllCategories();
    }
    const breadcrumbs: Breadcrumb[] = [];
    let parentId = category.parentId;

    while (parentId) {
      const parent = allCategories.find(c => c.id === parentId);
      breadcrumbs.unshift({
        id: parent.id,
        name: parent.name,
        slug: parent.slug
      });

      parentId = parent.parentId;
    }

    return breadcrumbs;
  }

  async reoderCategory(categoryId: number, targetCategoryId: number, position: ReorderPositionEnum) {
    const category = await this.categoryModel.findById(categoryId).exec();
    if (!category) { throw new BadRequestException(__('Category with id "$1" not found', 'ru', categoryId)); }

    const targetCategory = await this.categoryModel.findById(targetCategoryId).exec();
    if (!targetCategory) { throw new BadRequestException(__('Category with id "$1" not found', 'ru', targetCategoryId)); }

    const session = await this.categoryModel.db.startSession();
    session.startTransaction();

    try {

      if (position === ReorderPositionEnum.Inside) {

        if (category.parentId !== targetCategoryId) {
          category.parentId = targetCategoryId;
          const lastSiblingOrder = await this.getLastSiblingOrder(category.parentId);
          category.reversedSortOrder = lastSiblingOrder ? lastSiblingOrder + 1 : 0;
          await category.save({ session });
        }

      } else {
        let filterOperator;
        let newOrder;
        if (position === ReorderPositionEnum.Start) {
          filterOperator = '$gte';
          newOrder = targetCategory.reversedSortOrder;
        } else if (position === ReorderPositionEnum.End) {
          filterOperator = '$gt';
          newOrder = targetCategory.reversedSortOrder + 1;
        }

        const sortProp: keyof Category = 'reversedSortOrder';
        await this.categoryModel.updateMany(
          { [sortProp]: { [filterOperator]: targetCategory.reversedSortOrder } },
          { $inc: { [sortProp]: 1 } }
        ).session(session).exec();

        category.parentId = targetCategory.parentId;
        category.reversedSortOrder = newOrder;
        await category.save({ session });
      }

      await session.commitTransaction();
    } catch (ex) {
      await session.abortTransaction();
      throw ex;
    } finally {
      await session.endSession();
    }
  }

  private async getLastSiblingOrder(parentId: number): Promise<number | undefined> {
    const sortProp: keyof Category = 'reversedSortOrder';
    const lastSibling = await this.categoryModel
      .findOne({ parentId })
      .sort({ [sortProp]: 'desc' })
      .exec();

    if (lastSibling) {
      return lastSibling.reversedSortOrder + 1;
    }
  }
}
