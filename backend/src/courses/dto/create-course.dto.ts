import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Language } from "../enums/language.enum";
import { Status } from "../enums/status.enum";

export class CreateCourseDto {
  @ApiProperty({
    description: 'Título do curso',
    example: 'Introdução ao TypeScript',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Resumo ou descrição breve do curso',
    example: 'Curso introdutório sobre os conceitos básicos do TypeScript.',
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiPropertyOptional({
    enum: Language,
    description: 'Idioma do curso (opcional)',
    example: Language.PT,
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @ApiPropertyOptional({
    enum: Status,
    description: 'Status do curso (opcional)',
    example: Status.DRAFT,
    default: Status.DRAFT
  })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiPropertyOptional({
    description: 'Data de publicação do curso (formato ISO 8601, opcional)',
    example: '2025-10-21',
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: Date;

  @IsNumber()
  @IsOptional()
  userId: number;
}