import * as path from "node:path";

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpRedirectResponse,
  HttpStatus,
  Inject,
  Post,
  Query,
  Redirect,
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
    const data = await this.authorizationService.preparePrompt({ requestId });
    return this.templateService.renderTemplate(
      path.join(__dirname, "template", "prompt.html"),
      {
        ...data,
        submitUrl: "/oauth/prompt",
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
  @Redirect()
  async postPrompt(
    @Body() body: PromptRequestDto,
  ): Promise<HttpRedirectResponse> {
    const { redirectUriWithAuthorizationCodeAndState } =
      await this.authorizationService.submitPrompt({
        requestId: body.request_id,
        credentials: {
          email: body.email,
          password: body.password,
          rememberMe: body.remember_me || false,
        },
        scopes: body.scopes,
      });

    return {
      url: redirectUriWithAuthorizationCodeAndState,
      statusCode: HttpStatus.FOUND,
    } satisfies HttpRedirectResponse;
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
