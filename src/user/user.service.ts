import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';
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
      photo.data = file.buffer; // ফাইলের বাইনারি ডাটা
      photo.originalName = file.originalname;
      photo.size = file.size;
      photo.mimeType = file.mimetype; // ফাইলের MIME টাইপ
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

    console.log('Request Body:', body);
    console.log('Removed Images:', body['removedImages[]'] || body.removedImages);

    let removed = body['removedImages[]'] || body.removedImages;

    if (removed) {
      if (typeof removed === 'string') {
        removed = [removed];
      }

      if (Array.isArray(removed) && removed.length > 0) {
        const toRemove = user.photos.filter((p) =>
          p.id && removed.map(String).includes(p.id.toString()),
        );

        console.log('Photos to Remove:', toRemove);

        if (toRemove.length > 0) {
          await this.photoRepo.delete(
            toRemove.map((photo) => photo.id),
          );
          user.photos = user.photos.filter(
            (p) => !p.id || !removed.map(String).includes(p.id.toString()),
          );

          console.log('Updated User Photos:', user.photos);
        }
      }
    }

    for (const file of files) {
      const photo = new Photo();
      photo.data = file.buffer; // ফাইলের বাইনারি ডাটা
      photo.originalName = file.originalname;
      photo.size = file.size;
      photo.mimeType = file.mimetype; // ফাইলের MIME টাইপ
      user.photos.push(photo);
    }

    const updatedUser = await this.userRepo.save(user);
    console.log('Saved User:', updatedUser);

    return updatedUser;
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) throw new NotFoundException('User not found');

    return this.userRepo.remove(user);
  }

  async downloadFile(res: Response, photoId: string) {
    const photo = await this.photoRepo.findOne({ where: { id: parseInt(photoId) } });
    if (!photo) {
      throw new NotFoundException('File not found');
    }

    res.set({
      'Content-Type': photo.mimeType,
      'Content-Disposition': `attachment; filename="${photo.originalName}"`,
    });

    res.send(photo.data); // বাইনারি ডাটা পাঠানো
  }

  async previewFile(res: Response, photoId: string) {
    const photo = await this.photoRepo.findOne({ where: { id: parseInt(photoId) } });
    if (!photo) {
      throw new NotFoundException('File not found');
    }

    res.set({
      'Content-Type': photo.mimeType,
    });

    res.send(photo.data); // বাইনারি ডাটা পাঠানো প্রিভিউর জন্য
  }
}