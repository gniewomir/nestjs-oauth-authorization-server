import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
  @ApiProperty({
    description: "Access token for API security",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type (always "Bearer")',
    example: "Bearer",
  })
  token_type: string;

  @ApiProperty({
    description: "Token expiration time in seconds",
    example: 3600,
  })
  expires_in: number;

  @ApiProperty({
    description: "Refresh token for obtaining new access tokens",
    example: "refresh_token_123",
  })
  refresh_token: string;

  @ApiProperty({
    description: "ID token containing user information",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  id_token: string;

  @ApiProperty({
    description: "Granted scopes",
    example: "task:api admin:api",
  })
  scope: string;
}
