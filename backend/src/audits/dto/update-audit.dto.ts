import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAuditDto } from './create-audit.dto';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Status } from '../enums/status.enum';

export class UpdateAuditDto {
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiPropertyOptional({
    description: 'Status anterior do curso antes da mudança.',
    enum: Status,
    example: Status.PENDING_REVIEW
  })
  @IsEnum(Status)
  @IsOptional()
  fromStatus?: Status;

  @ApiPropertyOptional({
    description: 'Novo status do curso após a mudança.',
    enum: Status,
    example: Status.PUBLISHED,
  })
  @IsEnum(Status)
  @IsOptional()
  toStatus?: Status;

  @ApiPropertyOptional({
    description: 'Motivo da mudança de status, se houver.',
    example: 'Curso em revisão.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
