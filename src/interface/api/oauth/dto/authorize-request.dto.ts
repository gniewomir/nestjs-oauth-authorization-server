import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodsEnum } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";

export class AuthorizeRequestDto {
  @ApiProperty({
    description: "OAuth client identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({
    description: 'Response type (must be "code" for Authorization Code flow)',
    example: "code",
    enum: ["code"],
  })
  @IsString()
  @IsIn(["code"])
  response_type: string;

  @ApiProperty({
    description: "Requested scopes (space-separated)",
    example: "task:api admin:api",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  scope: string;

  @ApiProperty({
    description:
      "Redirect URI (optional - must match registered client redirect URI)",
    example: "https://client-website.com/callback",
    required: false,
  })
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  @IsOptional()
  redirect_uri?: string;

  @ApiProperty({
    description:
      "State parameter for CSRF protection and keeping track of the request on the client side",
    example: "random-state-string",
    required: false,
  })
  @IsString()
  @MaxLength(2048)
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: "PKCE code challenge (base64url encoded SHA256 hash)",
    example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(43)
  @MaxLength(128)
  code_challenge: string;

  @ApiProperty({
    description: `PKCE code challenge method`,
    example: CodeChallengeMethodsEnum.S256,
    enum: Object.values(CodeChallengeMethodsEnum),
  })
  @IsString()
  @IsIn(Object.values(CodeChallengeMethodsEnum))
  code_challenge_method: string;

  @ApiProperty({
    description:
      `Non standard, optional property to indicate,` +
      ` if user should be presented with registration or authorization form.`,
    example: IntentEnum.AUTHORIZE_NEW_USER,
    enum: Object.values(IntentEnum),
    enumName: "IntentEnum",
  })
  @IsString()
  @IsIn(Object.values(IntentEnum))
  @IsOptional()
  intent?: string;
}
