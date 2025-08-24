import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";

export class PromptSubmitRequestDto {
  @ApiProperty({
    description: "Authorization request identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  request_id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    description: "User password",
    example: "securePassword123",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({
    description: "Remember me option",
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  remember_me?: boolean;

  @ApiProperty({
    description: "User choice - authorize or deny",
    example: "authorize",
    required: false,
    enum: ["authorize", "deny"],
  })
  @IsIn(["authorize", "deny"])
  @IsOptional()
  choice?: string;

  @ApiProperty({
    description:
      `Non standard, optional property to indicate,` +
      ` if user should be presented with registration or authorization form.`,
    example: IntentEnum.AUTHORIZE_NEW_USER,
    enum: Object.values(IntentEnum).map((val) => val.toString()),
    enumName: "IntentEnum",
  })
  @IsString()
  @IsIn(Object.values(IntentEnum).map((val) => val.toString()))
  @IsOptional()
  intent?: string;

  @ApiProperty({
    description: "CSRF token for form protection",
    example: "a1b2c3d4e5f6...",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(255)
  _csrf: string;
}
