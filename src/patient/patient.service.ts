import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createProfile(userId: number, dto: CreatePatientDto): Promise<Patient> {
    const existingProfile = await this.patientRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new ConflictException('Patient profile already exists for this user.');
    }
    const profile = this.patientRepository.create({
      ...dto,
      userId,
    });
    return this.patientRepository.save(profile);
  }

  async getProfile(userId: number): Promise<Patient> {
    const profile = await this.patientRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Patient profile not found.');
    }
    return profile;
  }

  async updateProfile(userId: number, dto: UpdatePatientDto): Promise<Patient> {
    const profile = await this.patientRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Patient profile not found.');
    }
    Object.assign(profile, dto);
    return this.patientRepository.save(profile);
  }
}
