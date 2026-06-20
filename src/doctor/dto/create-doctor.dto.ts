import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateDoctorDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  experience: number;

  @IsNotEmpty()
  @IsString()
  qualification: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  consultationFee: number;

  @IsNotEmpty()
  @IsString()
  availabilityHours: string;

  @IsNotEmpty()
  @IsString()
  profileDetails: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;
}
