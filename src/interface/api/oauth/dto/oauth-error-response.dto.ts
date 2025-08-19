import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class OauthErrorDto {
  @ApiProperty({
    description: "A single ASCII string representing the error code",
    example: "invalid_request",
  })
  @IsString()
  @IsNotEmpty()
  error: string;

  @ApiProperty({
    description:
      "A human-readable text providing more detail, intended for the developer, not the end-user",
    example:
      "The request is missing a required parameter, includes an invalid value, or is malformed.",
  })
  @IsString()
  @IsNotEmpty()
  error_description: string;

  @ApiProperty({
    description: "A link to a web page with more information about the error",
  })
  @IsString()
  @IsOptional()
  error_uri?: string;

  @ApiProperty({
    description:
      "The exact state value the client application originally sent, used to prevent CSRF attacks",
  })
  @IsString()
  @IsOptional()
  state?: string;
}
