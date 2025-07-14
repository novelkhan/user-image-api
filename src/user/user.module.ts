import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Photo])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}