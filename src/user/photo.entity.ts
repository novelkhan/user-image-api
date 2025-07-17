import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  originalName: string;

  @Column()
  size: number;

  @ManyToOne(() => User, (user) => user.photos, {
    onDelete: 'CASCADE',
  })
  user: User;
}