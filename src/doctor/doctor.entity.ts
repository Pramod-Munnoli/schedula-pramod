import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column({ type: 'int' })
  experience: number;

  @Column()
  qualification: string;

  @Column({ type: 'int' })
  consultationFee: number;

  @Column()
  availabilityHours: string;

  @Column({ type: 'text' })
  profileDetails: string;

  @Column({ type: 'int', default: 15 })
  slotDuration: number;

  @CreateDateColumn()
  createdAt: Date;
}
