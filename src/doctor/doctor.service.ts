import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async createProfile(userId: number, dto: CreateDoctorDto): Promise<Doctor> {
    const existingProfile = await this.doctorRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new ConflictException('Doctor profile already exists for this user.');
    }
    const profile = this.doctorRepository.create({
      ...dto,
      userId,
    });
    return this.doctorRepository.save(profile);
  }

  async getProfile(userId: number): Promise<Doctor> {
    const profile = await this.doctorRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found.');
    }
    return profile;
  }

  async updateProfile(userId: number, dto: UpdateDoctorDto): Promise<Doctor> {
    const profile = await this.doctorRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found.');
    }
    Object.assign(profile, dto);
    return this.doctorRepository.save(profile);
  }
}
