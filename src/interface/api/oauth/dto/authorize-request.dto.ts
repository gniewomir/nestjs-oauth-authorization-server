import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodsEnum } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";

export class AuthorizeRequestDto {
  @ApiProperty({
    description: "OAuth client identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
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
  scope: string;

  @ApiProperty({
    description:
      "Redirect URI (optional - must match registered client redirect URI)",
    example: "https://client-website.com/callback",
    required: false,
  })
  @IsString()
  @IsOptional()
  redirect_uri?: string;

  @ApiProperty({
    description:
      "State parameter for CSRF protection and keeping track of the request on the client side",
    example: "random-state-string",
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: "PKCE code challenge (base64url encoded SHA256 hash)",
    example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  })
  @IsString()
  code_challenge: string;

  @ApiProperty({
    description: `PKCE code challenge method`,
    example: CodeChallengeMethodsEnum.S256,
    enum: Object.values(CodeChallengeMethodsEnum).map((val) => val.toString()),
  })
  @IsString()
  @IsIn(Object.values(CodeChallengeMethodsEnum).map((val) => val.toString()))
  code_challenge_method: string;

  @ApiProperty({
    description:
      `Non standard property to indicate,` +
      ` if user should presented with registration or authorization form.`,
    example: IntentEnum.AUTHORIZE_NEW_USER,
    enum: Object.values(IntentEnum).map((val) => val.toString()),
  })
  @IsString()
  @IsIn(Object.values(IntentEnum).map((val) => val.toString()))
  @IsOptional()
  intent?: string;
}
