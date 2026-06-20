import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Req, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/user.entity';
import { DoctorService } from './doctor.service';

@Controller('doctor/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly doctorService: DoctorService,
  ) {}

  private async getDoctorId(userId: number): Promise<number> {
    const profile = await this.doctorService.getProfile(userId);
    return profile.id;
  }

  private async resolveTargetDoctorId(user: any, requestedDoctorId?: string): Promise<number> {
    if (requestedDoctorId) {
      return parseInt(requestedDoctorId, 10);
    }
    // If no doctorId is passed, but the user is a doctor, default to their own schedule
    if (user.role === Role.DOCTOR) {
      return await this.getDoctorId(user.id);
    }
    throw new BadRequestException('Patients must provide a doctorId query parameter to check availability.');
  }

  @Post()
  @Roles(Role.DOCTOR)
  async createRecurring(@Req() req, @Body() dto: CreateRecurringAvailabilityDto) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availabilityService.createRecurring(doctorId, dto);
  }

  @Get()
  @Roles(Role.DOCTOR, Role.PATIENT)
  async getRecurring(@Req() req, @Query('doctorId') requestedDoctorId?: string) {
    const doctorId = await this.resolveTargetDoctorId(req.user, requestedDoctorId);
    return this.availabilityService.getRecurring(doctorId);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  async updateRecurring(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateRecurringAvailabilityDto>,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availabilityService.updateRecurring(doctorId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.DOCTOR)
  async deleteRecurring(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availabilityService.deleteRecurring(doctorId, id);
  }

  @Post('override')
  @Roles(Role.DOCTOR)
  async createOverride(@Req() req, @Body() dto: CreateCustomAvailabilityDto) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availabilityService.createOverride(doctorId, dto);
  }

  @Get('date')
  @Roles(Role.DOCTOR, Role.PATIENT)
  async getByDate(
    @Req() req,
    @Query('date') date: string,
    @Query('doctorId') requestedDoctorId?: string,
  ) {
    const doctorId = await this.resolveTargetDoctorId(req.user, requestedDoctorId);
    return this.availabilityService.getByDate(doctorId, date);
  }
}
