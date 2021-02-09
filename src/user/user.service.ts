import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AddOrUpdateUserDto } from '../shared/dtos/admin/user.dto';
import { EncryptorService } from '../shared/services/encryptor/encryptor.service';
import { __ } from '../shared/helpers/translate/translate.function';
import { Language } from '../shared/enums/language.enum';
import { havePermissions } from '../shared/helpers/have-permissions.function';
import { Role } from '../shared/enums/role.enum';

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

  async addNewUser(userDto: AddOrUpdateUserDto, currentUser: User, lang: Language): Promise<User> {
    if (!havePermissions(currentUser, userDto.role)) {
      throw new ForbiddenException(__('You do not have enough permissions to create such user', lang));
    }

    const newUser = new this.userModel(userDto);
    newUser.password = await this.encryptor.hash(userDto.password);
    await newUser.save();

    return newUser.toJSON();
  }

  async updateUser(userId: string, updateUserDto: AddOrUpdateUserDto, currentUser: User, lang: Language): Promise<User> {
    const userToUpdate = await this.userModel.findById(userId).exec();
    if (!userToUpdate) {
      throw new NotFoundException(__('User with id "$1" not found', lang, userId));
    }

    const isCurrentUserAndCanEdit = currentUser.id.equals(userToUpdate.id) && havePermissions(currentUser, updateUserDto.role);
    const isAdminAndCanEdit = havePermissions(currentUser, Role.Administrator) && updateUserDto.role >= Role.Administrator;
    if (!isAdminAndCanEdit && !isCurrentUserAndCanEdit) {
      throw new ForbiddenException(__('You do not have enough permissions to edit this user', lang));
    }

    // Update all fields except password, because it needs to be hashed before saving
    const passwordKey: keyof AddOrUpdateUserDto = 'password';
    Object.keys(updateUserDto)
      .filter(key => key !== passwordKey)
      .forEach(key => userToUpdate[key] = updateUserDto[key]);

    if (updateUserDto.password) {
      userToUpdate.password = await this.encryptor.hash(updateUserDto.password);
    }

    await userToUpdate.save();
    return userToUpdate.toJSON();
  }

  async deleteUser(userId: string, currentUser: User, lang: Language): Promise<User> {
    const userToDelete = await this.getUserById(userId);
    if (!userToDelete) {
      throw new NotFoundException(__('User with id "$1" not found', lang, userId));
    }
    if (!havePermissions(currentUser, Role.Administrator)) {
      throw new ForbiddenException(__('You do not have enough permissions to delete users', lang));
    }

    return userToDelete.toJSON();
  }
}
