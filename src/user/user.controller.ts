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
import { Response } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }]))
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
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }]))
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

  @Get('download/:photoId')
  download(@Param('photoId') photoId: string, @Res() res: Response) {
    return this.userService.downloadFile(res, photoId);
  }

  @Get('preview/:photoId')
  preview(@Param('photoId') photoId: string, @Res() res: Response) {
    return this.userService.previewFile(res, photoId);
  }
}