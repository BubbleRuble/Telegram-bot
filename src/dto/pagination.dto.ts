import { IsBooleanString, IsInt, IsOptional, IsPositive } from "class-validator";
import { Transform } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 20))
  @IsInt()
  @IsPositive()
  perPage?: number = 20;

  @IsOptional()
  q?: string;

  @IsOptional()
  @IsBooleanString()
  isActive: string;
}