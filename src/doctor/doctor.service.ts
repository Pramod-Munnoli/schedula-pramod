import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { QueryDoctorDto } from './dto/query-doctor.dto';

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

  async findAll(filters: QueryDoctorDto) {
    let page = Number(filters.page);
    let limit = Number(filters.limit);

    if (isNaN(page) || !Number.isInteger(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
      limit = 10;
    }

    const query = this.doctorRepository.createQueryBuilder('doctor');

    if (filters.specialization) {
      query.andWhere('LOWER(doctor.specialization) = :specialization', {
        specialization: filters.specialization.toLowerCase().trim(),
      });
    }

    if (filters.search) {
      query.andWhere('LOWER(doctor.fullName) LIKE :search', {
        search: `%${filters.search.toLowerCase().trim()}%`,
      });
    }

    if (filters.availability !== undefined) {
      const isAvailable = filters.availability === true || String(filters.availability).toLowerCase() === 'true';
      if (isAvailable) {
        query.andWhere("doctor.availabilityHours IS NOT NULL AND doctor.availabilityHours != ''");
      } else {
        query.andWhere("(doctor.availabilityHours IS NULL OR doctor.availabilityHours = '')");
      }
    }

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);
    const data = await query.getMany();

    let message: string | undefined;
    const totalInDb = await this.doctorRepository.count();

    if (totalInDb === 0) {
      message = 'No doctors found in the database.';
    } else if (data.length === 0) {
      if (filters.specialization) {
        const specExists = await this.doctorRepository
          .createQueryBuilder('doctor')
          .where('LOWER(doctor.specialization) = :specialization', {
            specialization: filters.specialization.toLowerCase().trim(),
          })
          .getCount();

        if (specExists === 0) {
          message = `Invalid specialization or no doctors found with specialization: ${filters.specialization}`;
        } else {
          message = `No doctors found matching the query for specialization: ${filters.specialization}`;
        }
      } else if (filters.search) {
        message = `No doctors found matching the search term: ${filters.search}`;
      } else {
        message = 'No doctors found matching the specified criteria.';
      }
    }

    return {
      data,
      total,
      page,
      limit,
      ...(message ? { message } : {}),
    };
  }

  async findById(id: any): Promise<Doctor> {
    const numericId = Number(id);
    if (isNaN(numericId) || !Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    const doctor = await this.doctorRepository.findOne({ where: { id: numericId } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }
}

