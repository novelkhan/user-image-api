import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { Photo } from './user/photo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Photo],
    synchronize: true,
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false, // Render.com-এর জন্য দরকার
      },
    },
  }),
    UserModule,
  ],
})
export class AppModule {}