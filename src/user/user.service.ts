import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Photo) private photoRepo: Repository<Photo>,
  ) {}

  async createUser(dto: any, files: Express.Multer.File[]) {
    if (Array.isArray(dto)) {
      dto = dto[0];
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

    // ✅ Remove selected old photos
    let removed = body['removedImages[]'] || body.removedImages;

    if (typeof removed === 'string') {
      removed = [removed];
    }

    if (Array.isArray(removed)) {
      const toRemove = user.photos.filter((p) => removed.includes(p.url));

      // ✅ Delete files from disk
      for (const photo of toRemove) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', photo.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // ✅ Remove from DB
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

    // ✅ Delete all associated image files
    for (const photo of user.photos) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return this.userRepo.remove(user);
  }
}