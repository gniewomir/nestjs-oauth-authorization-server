import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AuthorizationService } from "@application/authorization/authorization.service";

import { AuthorizeRequestDto } from "./dto/authorize-request.dto";
import { PromptRequestDto } from "./dto/prompt-request.dto";
import { TokenRequestDto } from "./dto/token-request.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@ApiTags("OAuth2 Authorization")
@Controller("oauth")
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get("authorize")
  @ApiOperation({
    summary: "OAuth2 Authorization Endpoint",
    description: "Initiates OAuth2 Authorization Code flow with PKCE",
  })
  @ApiQuery({ name: "client_id", required: true })
  @ApiQuery({ name: "redirect_uri", required: true })
  @ApiQuery({ name: "response_type", required: true })
  @ApiQuery({ name: "scope", required: false })
  @ApiQuery({ name: "state", required: false })
  @ApiQuery({ name: "code_challenge", required: true })
  @ApiQuery({ name: "code_challenge_method", required: true })
  @ApiResponse({
    status: 302,
    description: "Redirect to authorization prompt",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request parameters",
  })
  @Redirect()
  async authorize(
    @Query() query: AuthorizeRequestDto,
  ): Promise<{ url: string }> {
    try {
      const request = await this.authorizationService.request({
        clientId: query.client_id,
        redirectUri: query.redirect_uri,
        scope: query.scope || "",
        state: query.state || "",
        codeChallenge: query.code_challenge,
        codeChallengeMethod: query.code_challenge_method,
        responseType: query.response_type,
      });

      // Redirect to authorization prompt with request ID
      const promptUrl = `/oauth/prompt?request_id=${request.requestId}`;

      return { url: promptUrl };
    } catch {
      throw new HttpException(
        `Invalid authorization request`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post("prompt")
  @ApiOperation({
    summary: "OAuth2 Authorization Prompt",
    description: "Handles user authentication and consent for OAuth2 flow",
  })
  @ApiResponse({
    status: 501,
    description: "Not implemented",
  })
  async prompt(
    @Body() body: PromptRequestDto,
  ): Promise<{ authorization_code: string }> {
    throw new HttpException("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  @Post("token")
  @ApiOperation({
    summary: "OAuth2 Token Endpoint",
    description:
      "Exchanges authorization code for tokens or refreshes access tokens",
  })
  @ApiResponse({
    status: 501,
    description: "Not implemented",
  })
  async token(@Body() body: TokenRequestDto): Promise<TokenResponseDto> {
    throw new HttpException("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }
}
