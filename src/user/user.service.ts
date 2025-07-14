import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
  ) {}

  async createUser(dto: CreateUserDto, files: Express.Multer.File[]) {
    const user = this.userRepo.create(dto);
    user.photos = files.map((file) => {
      const photo = new Photo();
      photo.url = file.filename;
      return photo;
    });
    return this.userRepo.save(user);
  }

  getAllUsers() {
    return this.userRepo.find();
  }

  getUserById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async updateUser(id: number, dto: CreateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.name = dto.name;
    user.email = dto.email;
    return this.userRepo.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.userRepo.remove(user);
  }
}