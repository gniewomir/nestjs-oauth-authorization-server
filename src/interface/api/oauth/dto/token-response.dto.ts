import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class TokenResponseDto {
  @ApiProperty({
    description: "Access token for API security",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'Token type (always "Bearer")',
    example: "Bearer",
  })
  @IsString()
  @IsNotEmpty()
  token_type: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 3600,
  })
  @IsNumber()
  @Min(1)
  expires_in: number;

  @ApiProperty({
    description: "Refresh token for obtaining new access tokens",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsOptional()
  refresh_token?: string;

  @ApiProperty({
    description: "ID token containing user information",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsOptional()
  id_token?: string;

  @ApiProperty({
    description: "Granted scopes",
    example: "task:api admin:api",
  })
  @IsString()
  @IsNotEmpty()
  scope: string;
}
