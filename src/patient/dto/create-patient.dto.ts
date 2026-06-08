import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreatePatientDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  age: number;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsString()
  contactDetails: string;

  @IsOptional()
  @IsString()
  healthInfo?: string;
}
