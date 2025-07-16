import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
  ) {}

  async createUser(dto: any, files: Express.Multer.File[]) {
    // ⚠️ Check if dto is accidentally an array
    if (Array.isArray(dto)) {
      dto = dto[0]; // Fix if sent as array
    }

    const user = new User();
    user.name = dto.name;
    user.email = dto.email;
    user.photos = [];

    for (const file of files) {
      const photo = new Photo();
      photo.url = file.filename;
      user.photos.push(photo);
    }

    return this.userRepo.save(user);
  }

  getAllUsers() {
    return this.userRepo.find({ relations: ['photos'] });
  }

  getUserById(id: number) {
    return this.userRepo.findOne({
      where: { id },
      relations: ['photos'],
    });
  }

  async updateUserWithImages(
    id: number,
    body: any,
    files: Express.Multer.File[],
  ) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) throw new NotFoundException('User not found');

    user.name = body.name;
    user.email = body.email;

    // ✅ Remove old selected images
    let removed = body['removedImages[]'] || body.removedImages;

    if (typeof removed === 'string') {
      removed = [removed]; // handle single image case
    }

    if (Array.isArray(removed)) {
      const toRemove = user.photos.filter((p) => removed.includes(p.url));
      await this.photoRepo.remove(toRemove);
      user.photos = user.photos.filter((p) => !removed.includes(p.url));
    }

    // ✅ Add new uploaded images
    for (const file of files) {
      const photo = new Photo();
      photo.url = file.filename;
      user.photos.push(photo);
    }

    return this.userRepo.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) throw new NotFoundException('User not found');

    return this.userRepo.remove(user);
  }
}