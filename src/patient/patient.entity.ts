import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  fullName: string;

  @Column({ type: 'int' })
  age: number;

  @Column()
  gender: string;

  @Column()
  contactDetails: string;

  @Column({ type: 'text', nullable: true })
  healthInfo: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
