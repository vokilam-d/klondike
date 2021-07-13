import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inventory } from './models/inventory.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { ClientSession } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { getPropertyOf } from '../shared/helpers/get-property-of.function';
import { ReservedInventory } from './models/reserved-inventory.model';
import { __ } from '../shared/helpers/translate/translate.function';
import { Language } from '../shared/enums/language.enum';
import { User } from '../user/models/user.model';

@Injectable()
export class InventoryService {

  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name) private readonly inventoryModel: ReturnModelType<typeof Inventory>,
    // private readonly logger: FileLogger
  ) {
    // this.logger.setContext(InventoryService.name);
  }

  async createInventory(
    sku: string,
    productId: number,
    qtyInStock: number = 0,
    session: ClientSession,
    user: DocumentType<User>
  ): Promise<DocumentType<Inventory>> {

    const model: Inventory = { sku, productId, qtyInStock, reserved: [], logs: [] };
    InventoryService.addLog(model, `Created inventory: sku=${sku}, qtyInStock=${qtyInStock}, userLogin=${user?.login}`);

    const newInventory = new this.inventoryModel(model);
    await newInventory.save({ session });

    return newInventory;
  }

  async getInventory(sku: string, lang: Language, session?: ClientSession): Promise<DocumentType<Inventory>> {
    const found = await this.inventoryModel.findOne({ sku }).session(session).exec();
    if (!found) {
      throw new NotFoundException(__('Cannot find inventory with sku "$1"', lang, sku));
    }

    return found;
  }

  async getInventories(skus: string[], lang: Language, session?: ClientSession): Promise<DocumentType<Inventory>[]> {
    return this.inventoryModel.find({ sku: { $in: skus } }).session(session).exec();
  }

  async updateInventory(sku: string, qty: number, lang: Language, session: ClientSession, user: DocumentType<User>) {

    const found = await this.getInventory(sku, lang, session);

    const qtyInOrders = found.reserved.reduce((sum, ordered) => sum + ordered.qty, 0);
    if (qtyInOrders > qty) {
      throw new ForbiddenException(__('Cannot set quantity: more than "$1" items are ordered', lang, qty));
    }

    if (found.qtyInStock !== qty) {
      const prevQtyInStock = found.qtyInStock;
      found.qtyInStock = qty;

      InventoryService.addLog(found, `Updated inventory: prevQtyInStock=${prevQtyInStock}, newQtyInStock=${found.qtyInStock}, userLogin=${user?.login}`);

      await found.save({ session });

      this.logger.log(`Updated inventory: sku=${found.sku}, qtyInStock=${found.qtyInStock}`, undefined);
    }

    return found;
  }

  async addToStock(sku: string, qty: number, lang: Language, session: ClientSession, user): Promise<DocumentType<Inventory>> {
    const inventory = await this.getInventory(sku, lang, session);
    const prevQtyInStock = inventory.qtyInStock;
    inventory.qtyInStock += qty;

    InventoryService.addLog(inventory, `Added to stock, prevQtyInStock=${prevQtyInStock}, qtyAdded=${qty}, newQtyInStock=${inventory.qtyInStock}, userLogin=${user?.login}`);

    await inventory.save({ session });

    this.logger.log(`Added to stock: sku=${inventory.sku}, qty added=${qty}, new qtyInStock=${inventory.qtyInStock}`);

    return inventory;
  }

  async addToOrdered(sku: string, qty: number, orderId: number, lang: Language, session: ClientSession, user: User): Promise<DocumentType<Inventory>> {
    const inventory = await this.getInventory(sku, lang, session);
    if (inventory.qtyInStock < qty) {
      throw new ForbiddenException(__('Not enough quantity in stock. You are trying to add: $1. In stock: $2', lang, qty, inventory.qtyInStock));
    }

    const orderedInventory = new ReservedInventory();
    orderedInventory.qty = qty;
    orderedInventory.orderId = orderId;
    orderedInventory.timestamp = new Date();

    inventory.reserved.push(orderedInventory);

    InventoryService.addLog(inventory, `Added to ordered, orderId=${orderId}, qtyInStock=${inventory.qtyInStock}, orderedQty=${qty}, userLogin=${user?.login}`);

    await inventory.save({ session });

    this.logger.log(`Added to ordered: sku=${inventory.sku}, qtyInStock=${inventory.qtyInStock}, orderId=${orderId}, orderedQty=${qty}`);

    return inventory;
  }

  async removeFromOrdered(sku: string, orderId: number, lang: Language, session: ClientSession, user: User): Promise<DocumentType<Inventory>> {
    const inventory = await this.getInventory(sku, lang, session);

    const reservedIndex = inventory.reserved.findIndex(reserved => reserved.orderId === orderId);
    if (reservedIndex === -1) {
      return inventory;
    }
    const removedReserved = inventory.reserved.splice(reservedIndex, 1);

    InventoryService.addLog(inventory, `Removed to ordered, orderId=${orderId}, qtyInStock=${inventory.qtyInStock}, removedOrderedQty=${removedReserved[0].qty}, userLogin=${user?.login}`);

    await inventory.save({ session });

    this.logger.log(`Removed from ordered: sku=${inventory.sku}, qtyInStock=${inventory.qtyInStock}, orderId=${orderId}`);

    return inventory;
  }

  async removeFromOrderedAndStock(
    sku: string,
    qty: number,
    orderId: number,
    lang: Language,
    session: ClientSession,
    user?: User
  ): Promise<DocumentType<Inventory>> {
    const inventory = await this.getInventory(sku, lang, session);
    const reservedIndex = inventory.reserved.findIndex(reserved => reserved.orderId === orderId);
    if (reservedIndex !== -1) {
      inventory.reserved.splice(reservedIndex, 1);
    }
    inventory.qtyInStock -= qty;

    let logMessage = `Removed to ordered and stock, orderId=${orderId}, removedQty=${qty}, newQtyInStock=${inventory.qtyInStock}`;
    if (user) {
      logMessage += `, userLogin=${user.login}`;
    } else {
      logMessage += `, source=system`;
    }
    InventoryService.addLog(inventory, logMessage);

    await inventory.save({ session });

    this.logger.log(`Removed from ordered and stock: sku=${inventory.sku}, qty removed=${qty}, new qtyInStock=${inventory.qtyInStock}, orderId=${orderId}`);

    return inventory;
  }

  deleteInventory(sku: string, session: ClientSession) {
    return this.inventoryModel.findOneAndDelete({ sku }).session(session).exec();
  }

  private static addLog(inventory: Inventory, message: string): void {
    inventory.logs.push({ time: new Date(), text: message });
  }
}
