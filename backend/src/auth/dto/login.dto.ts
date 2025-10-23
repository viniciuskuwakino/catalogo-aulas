import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: 'Login do usuário',
    example: 'vinicius@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: '!23mudaR',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
