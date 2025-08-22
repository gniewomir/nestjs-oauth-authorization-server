import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";

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
    description: `Indicates if submission came from registration or authorization form`,
    example: IntentEnum.AUTHORIZE_NEW_USER.toString(),
    enum: Object.values(IntentEnum).map((val) => val.toString()),
    required: true,
  })
  @IsString()
  @IsIn(Object.values(IntentEnum).map((val) => val.toString()))
  intent: string;
}
