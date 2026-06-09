import { IsOptional, IsString, IsInt, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryDoctorDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const val = Number(value);
    if (isNaN(val) || !Number.isInteger(val) || val < 1) {
      return 1;
    }
    return val;
  })
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    const val = Number(value);
    if (isNaN(val) || !Number.isInteger(val) || val < 1) {
      return 10;
    }
    return val;
  })
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  availability?: boolean;
}
