import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ nullable: true })
  patientId: number;

  @ManyToOne(() => Patient, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: 'SCHEDULED' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
