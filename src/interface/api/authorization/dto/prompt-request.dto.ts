import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PromptRequestDto {
  @ApiProperty({
    description: "Authorization request identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "securePassword123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "Remember me option",
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  remember_me?: boolean;
}
