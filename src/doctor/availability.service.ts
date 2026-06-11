import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability, DayOfWeek } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';
import { DoctorService } from './doctor.service';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private readonly customRepo: Repository<CustomAvailability>,
    private readonly doctorService: DoctorService,
  ) {}

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  private hasOverlap(existingSlots: { startTime: string; endTime: string }[], newStart: string, newEnd: string): boolean {
    return existingSlots.some(slot => {
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      return newStart < slot.endTime && newEnd > slot.startTime;
    });
  }

  async createRecurring(doctorId: number, dto: CreateRecurringAvailabilityDto) {
    // Ensure doctor exists
    await this.doctorService.findById(doctorId);
    
    this.validateTimeRange(dto.startTime, dto.endTime);

    const existingForDay = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: dto.dayOfWeek },
    });

    // Check exact duplicate
    const isDuplicate = existingForDay.some(
      slot => slot.startTime === dto.startTime && slot.endTime === dto.endTime,
    );
    if (isDuplicate) {
      throw new ConflictException('Exact duplicate availability slot already exists.');
    }

    if (this.hasOverlap(existingForDay, dto.startTime, dto.endTime)) {
      throw new ConflictException('Overlapping availability slot exists for this day.');
    }

    const newSlot = this.recurringRepo.create({
      doctorId,
      ...dto,
    });
    return this.recurringRepo.save(newSlot);
  }

  async getRecurring(doctorId: number) {
    return this.recurringRepo.find({
      where: { doctorId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(doctorId: number, id: number, dto: Partial<CreateRecurringAvailabilityDto>) {
    const slot = await this.recurringRepo.findOne({ where: { id, doctorId } });
    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found.');
    }

    const newStartTime = dto.startTime ?? slot.startTime;
    const newEndTime = dto.endTime ?? slot.endTime;
    const newDayOfWeek = dto.dayOfWeek ?? slot.dayOfWeek;

    this.validateTimeRange(newStartTime, newEndTime);

    const existingForDay = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: newDayOfWeek },
    });

    const otherSlots = existingForDay.filter(s => s.id !== id);

    if (this.hasOverlap(otherSlots, newStartTime, newEndTime)) {
      throw new ConflictException('Overlapping availability slot exists for this day.');
    }

    Object.assign(slot, dto);
    return this.recurringRepo.save(slot);
  }

  async deleteRecurring(doctorId: number, id: number) {
    const slot = await this.recurringRepo.findOne({ where: { id, doctorId } });
    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found.');
    }
    await this.recurringRepo.remove(slot);
    return { message: 'Slot deleted successfully' };
  }

  async createOverride(doctorId: number, dto: CreateCustomAvailabilityDto) {
    await this.doctorService.findById(doctorId);
    this.validateTimeRange(dto.startTime, dto.endTime);

    const dateObj = new Date(dto.date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const existingForDate = await this.customRepo.find({
      where: { doctorId, date: dateObj },
    });

    if (this.hasOverlap(existingForDate, dto.startTime, dto.endTime)) {
      throw new ConflictException('Overlapping custom override exists for this date.');
    }

    const newOverride = this.customRepo.create({
      doctorId,
      date: dateObj,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isOverride: true,
    });
    return this.customRepo.save(newOverride);
  }

  async getByDate(doctorId: number, dateStr: string) {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const overrides = await this.customRepo.find({
      where: { doctorId, date: dateObj },
      order: { startTime: 'ASC' },
    });

    if (overrides.length > 0) {
      return { type: 'custom', slots: overrides };
    }

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeekStr = days[dateObj.getDay()] as DayOfWeek;

    const recurring = await this.recurringRepo.find({
      where: { doctorId, dayOfWeek: dayOfWeekStr },
      order: { startTime: 'ASC' },
    });

    return { type: 'recurring', slots: recurring };
  }
}
