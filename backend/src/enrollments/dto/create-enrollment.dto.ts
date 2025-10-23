import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateEnrollmentDto {
  
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({
    description: 'ID do curso para realizar a matrícula.',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  courseId: number;
}
