import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";
import { Role } from "../enums/role.enum";

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Vinícius Kuwakino',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'E-mail único do usuário',
    example: 'vinicius@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha forte do usuário',
    example: 'Str0ngP@ssword!',
  })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'Papel do usuário',
    example: Role.ADMIN,
    default: Role.STUDENT
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
