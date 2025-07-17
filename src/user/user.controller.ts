import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }], {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  createUser(
    @Body() body: any,
    @UploadedFiles() files: { photos?: Express.Multer.File[] },
  ) {
    return this.userService.createUser(body, files?.photos || []);
  }

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }], {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() files: { photos?: Express.Multer.File[] },
  ) {
    return this.userService.updateUserWithImages(id, body, files?.photos || []);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Get('download/:storedName')
  download(@Param('storedName') storedName: string, @Res() res: Response) {
    return this.userService.downloadFile(res, storedName);
  }

}