import * as path from "node:path";

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { AuthorizationService } from "@application/authorization/authorization.service";
import { TemplateService } from "@infrastructure/template/template.service";
import { TemplateInterfaceSymbol } from "@interface/api/authorization/template/Template.interface";

import { AuthorizeRequestDto } from "./dto/authorize-request.dto";
import { PromptRequestDto } from "./dto/prompt-request.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@ApiTags("OAuth2 Authorization")
@Controller("oauth")
export class AuthorizationController {
  constructor(
    private readonly authorizationService: AuthorizationService,
    @Inject(TemplateInterfaceSymbol)
    private readonly templateService: TemplateService,
  ) {}

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
    status: HttpStatus.TEMPORARY_REDIRECT,
    description: "Redirect to authorization prompt",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request parameters",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Server denied request",
  })
  async authorize(
    @Query() query: AuthorizeRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const request = await this.authorizationService.request({
      clientId: query.client_id,
      redirectUri: query.redirect_uri,
      scope: query.scope,
      state: query.state,
      codeChallenge: query.code_challenge,
      codeChallengeMethod: query.code_challenge_method,
      responseType: query.response_type,
    });

    res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      `/oauth/prompt?request_id=${request.requestId}`,
    );
  }

  @Get("prompt")
  @ApiOperation({
    summary: "OAuth2 Authorization Prompt (display)",
    description: "Handles user security and consent for OAuth2 flow",
  })
  @ApiResponse({
    status: 200,
    description: "Authorization prompt HTML page",
  })
  async getPrompt(@Query("request_id") requestId: string): Promise<string> {
    return this.templateService.renderTemplate(
      path.join(__dirname, "template", "prompt.html"),
      {
        requestId,
        clientName: "Example Application",
        redirectUri: "https://example.com/callback",
        requestedScopes: "task:api token:authenticate",
        state: "",
        taskApi: true,
        adminApi: false,
        tokenAuthenticate: true,
        tokenRefresh: false,
        tokenRefreshLargeTtl: false,
      },
    );
  }

  @Post("prompt")
  @ApiOperation({
    summary: "OAuth2 Authorization Prompt (submit)",
    description: "Handles user security and consent for OAuth2 flow",
  })
  @ApiResponse({
    status: HttpStatus.TEMPORARY_REDIRECT,
    description: "Redirect to client with authorization code",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request parameters",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Invalid credentials",
  })
  async postPrompt(
    @Body() body: PromptRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { code } = await this.authorizationService.submitPrompt({
        requestId: body.request_id,
        credentials: {
          email: body.email,
          password: body.password,
          rememberMe: body.remember_me || false,
        },
        scopes: body.scopes,
      });

      // Redirect to client with authorization code
      res.redirect(
        HttpStatus.TEMPORARY_REDIRECT,
        `/oauth/callback?code=${code}&state=${body.request_id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authorization failed";
      throw new HttpException(errorMessage, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get("callback")
  @ApiOperation({
    summary: "OAuth2 Callback Endpoint",
    description: "Handles authorization code callback",
  })
  callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ): void {
    // This would typically redirect to the original redirect_uri
    // For now, we'll just return the authorization code
    res.status(HttpStatus.OK).json({
      code,
      state,
    });
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
  token(): TokenResponseDto {
    throw new HttpException("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }
}
