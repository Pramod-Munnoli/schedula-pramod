import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from './doctor.entity';
import { AuthModule } from '../auth/auth.module';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { Appointment } from '../appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, RecurringAvailability, CustomAvailability, Appointment]),
    AuthModule,
  ],
  controllers: [AvailabilityController, DoctorController],
  providers: [DoctorService, AvailabilityService],
  exports: [DoctorService, AvailabilityService],
})
export class DoctorModule {}
