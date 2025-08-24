import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class OauthErrorDto {
  @ApiProperty({
    description: "A single ASCII string representing the error code",
    example: "invalid_request",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  error: string;

  @ApiProperty({
    description:
      "A human-readable text providing more detail, intended for the developer, not the end-user",
    example:
      "The request is missing a required parameter, includes an invalid value, or is malformed.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  error_description: string;

  @ApiProperty({
    description: "A link to a web page with more information about the error",
  })
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  @IsOptional()
  error_uri?: string;

  @ApiProperty({
    description:
      "The exact state value the client application originally sent, used to prevent CSRF attacks",
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  state?: string;
}
