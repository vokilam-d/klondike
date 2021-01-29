import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AddOrUpdateUserDto } from '../shared/dtos/admin/user.dto';
import { EncryptorService } from '../shared/services/encryptor/encryptor.service';
import { __ } from '../shared/helpers/translate/translate.function';
import { ShipmentDto } from '../shared/dtos/admin/shipment.dto';
import { Language } from '../shared/enums/language.enum';

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name) private readonly userModel: ReturnModelType<typeof User>,
    private readonly encryptor: EncryptorService
  ) { }

  async getUserById(id: string): Promise<DocumentType<User>> {
    return this.userModel.findById(id).exec();
  }

  async getUserByLogin(login: string): Promise<User> {
    return this.userModel.findOne({ login }).exec();
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => user.toJSON());
  }

  async addNewUser(userDto: AddOrUpdateUserDto): Promise<User> {
    const newUser = new this.userModel(userDto);
    newUser.password = await this.encryptor.hash(userDto.password);
    await newUser.save();

    return newUser.toJSON();
  }

  async updateUser(userId: string, userDto: AddOrUpdateUserDto, lang: Language): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(__('User with id "$1" not found', lang, userId));
    }

    user.password = await this.encryptor.hash(userDto.password);
    await user.save();
    return user.toJSON();
  }

  async deleteUser(userId: string, lang: Language): Promise<User> {
    const deleted = await this.userModel.findByIdAndDelete(userId).exec();
    if (!deleted) {
      throw new NotFoundException(__('User with id "$1" not found', lang, userId));
    }
    return deleted.toJSON();
  }
}
