import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ClockInWfhDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string;
}
