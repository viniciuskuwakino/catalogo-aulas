import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateLessonDto {
  @ApiProperty({
    description: 'ID do curso ao qual a lição pertence',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  courseId: number;

  @ApiProperty({
    description: 'Título da lição',
    example: 'Introdução ao NestJS',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Duração da lição em minutos',
    example: 25,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  durationMinutes: number;

  @ApiProperty({
    description: 'URL do vídeo da lição',
    example: 'https://example.com/videos/introducao-nestjs.mp4',
  })
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @ApiProperty({
    description: 'Ordem da lição dentro do curso',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  order: number;

  @ApiProperty({
    description: 'Indica se a lição está bloqueada para alunos não matriculados',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isLocked: boolean;
}
