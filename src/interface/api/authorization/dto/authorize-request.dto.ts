import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
    required: false,
  })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({
    description: "State parameter for CSRF protection",
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
    description: 'PKCE code challenge method (must be "S256")',
    example: "S256",
    enum: ["S256"],
  })
  @IsString()
  @IsIn(["S256"])
  code_challenge_method: string;
}
