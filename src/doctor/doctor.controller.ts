import { Controller, Get, Post, Patch, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/user.entity';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { QueryDoctorDto } from './dto/query-doctor.dto';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async findAll(@Query() query: QueryDoctorDto) {
    return this.doctorService.findAll(query);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async createProfile(@Req() req, @Body() dto: CreateDoctorDto) {
    return this.doctorService.createProfile(req.user.id, dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async getProfile(@Req() req) {
    return this.doctorService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  async updateProfile(@Req() req, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.doctorService.findById(id);
  }
}

