import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';
import { AddOrUpdateUserDto } from '../shared/dtos/admin/user.dto';
import { EncryptorService } from '../shared/services/encryptor/encryptor.service';

@Injectable()
export class UserService {

  constructor(@InjectModel(User.name) private readonly userModel: ReturnModelType<typeof User>,
              private readonly encryptor: EncryptorService) {
  }

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
    newUser.password = await this.encryptor.hashPassword(userDto.password);
    await newUser.save();

    return newUser.toJSON();
  }

  async updateUser(userId: string, userDto: AddOrUpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    user.password = await this.encryptor.hashPassword(userDto.password);
    await user.save();
    return user.toJSON();
  }

  async deleteUser(userId: string): Promise<User> {
    const deleted = await this.userModel.findByIdAndDelete(userId).exec();
    if (!deleted) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }
    return deleted.toJSON();
  }
}
