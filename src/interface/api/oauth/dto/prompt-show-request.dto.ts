import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";
import { userErrorCodes } from "@interface/api/utility";

export class PromptShowRequestDto {
  @ApiProperty({
    description: "Authorization request identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  request_id: string;

  @ApiProperty({
    description: "Error code if authorization failed",
    example: "invalid-email",
    enum: Object.keys(userErrorCodes),
    enumName: "UserErrorCodes",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.keys(userErrorCodes))
  error?: string;

  @ApiProperty({
    description: "User intent for authorization flow",
    example: IntentEnum.AUTHORIZE_NEW_USER,
    enum: Object.values(IntentEnum),
    enumName: "IntentEnum",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(IntentEnum))
  intent?: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;
}
