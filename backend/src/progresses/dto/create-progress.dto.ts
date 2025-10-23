import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateProgressDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  userId: number;


  @ApiProperty({
    description: 'ID da lição assistida',
    example: 15,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  lessonId: number;

  @ApiProperty({
    description: 'Quantidade de segundos já assistidos da lição',
    example: 120,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  watchedSeconds: number;

  @ApiProperty({
    description: 'Indica se a lição foi completamente assistida',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  completed: boolean;

}
