import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

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
      photo.originalName = file.originalname;
      photo.size = file.size;
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

    let removed = body['removedImages[]'] || body.removedImages;

    if (typeof removed === 'string') {
      removed = [removed];
    }

    if (Array.isArray(removed)) {
      const toRemove = user.photos.filter((p) => removed.includes(p.url));

      for (const photo of toRemove) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', photo.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await this.photoRepo.remove(toRemove);
      user.photos = user.photos.filter((p) => !removed.includes(p.url));
    }

    for (const file of files) {
      const photo = new Photo();
      photo.url = file.filename;
      photo.originalName = file.originalname;
      photo.size = file.size;
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

    for (const photo of user.photos) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return this.userRepo.remove(user);
  }

  downloadFile(res: Response, storedName: string) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', storedName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // ডাটাবেজ থেকে মূল নাম বের করি
    return this.photoRepo.findOneBy({ url: storedName }).then((photo) => {
      if (!photo) throw new NotFoundException('Original name not found');
      res.download(filePath, photo.originalName); // ✅ সঠিক নামে ডাউনলোড
    });
  }
}