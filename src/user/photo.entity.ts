import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bytea' }) // ফাইলের বাইনারি ডাটা সেভ করার জন্য
  data: Buffer;

  @Column()
  originalName: string;

  @Column()
  size: number;

  @Column()
  mimeType: string; // ফাইলের MIME টাইপ সেভ করার জন্য (যেমন: image/png, application/pdf)

  @ManyToOne(() => User, (user) => user.photos, {
    onDelete: 'CASCADE',
  })
  user: User;
}