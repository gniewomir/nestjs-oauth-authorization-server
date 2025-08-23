import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class TokenRequestDto {
  @ApiProperty({
    description: "Grant type",
    example: "authorization_code",
    enum: ["authorization_code", "refresh_token"],
  })
  @IsString()
  @IsIn(["authorization_code", "refresh_token"])
  grant_type: string;

  @ApiProperty({
    description: "OAuth client identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  client_id: string;

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
    description: "Authorization code (for authorization_code grant)",
    example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiProperty({
    description: "PKCE code verifier (for authorization_code grant)",
    example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  code_verifier?: string;

  @ApiProperty({
    description: "Refresh token (for refresh_token grant)",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;
}
