import * as path from "node:path";

import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { OauthInvalidCredentialsException } from "@domain/authentication/OAuth/Errors/OauthInvalidCredentialsException";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { TemplateService } from "@infrastructure/template/template.service";
import { TemplateInterfaceSymbol } from "@interface/api/authorization/template/Template.interface";

import { AuthorizeRequestDto } from "./dto/authorize-request.dto";
import { PromptRequestDto } from "./dto/prompt-request.dto";
import { TokenRequestDto } from "./dto/token-request.dto";
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
  @ApiQuery({ name: "response_type", required: true })
  @ApiQuery({ name: "scope", required: true })
  @ApiQuery({ name: "state", required: false })
  @ApiQuery({ name: "code_challenge", required: false })
  @ApiQuery({ name: "code_challenge_method", required: false })
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
  async getPrompt(
    @Query("request_id") requestId: string,
    @Query("error") error?: string,
  ): Promise<string> {
    const { requestedScopes, clientName, allowRememberMe } =
      await this.authorizationService.preparePrompt({
        requestId,
      });

    const errorObject = {
      [OauthInvalidCredentialsException.DEFAULT_CODE]: {
        errorCode: OauthInvalidCredentialsException.DEFAULT_CODE,
        errorMessage: OauthInvalidCredentialsException.DEFAULT_DESCRIPTION,
      },
      [OauthInvalidRequestException.DEFAULT_CODE]: {
        errorCode: OauthInvalidRequestException.DEFAULT_CODE,
        errorMessage: "Did you provided a valid email?",
      },
      "no-error": undefined,
    }[error || "no-error"];

    return this.templateService.renderTemplate(
      path.join(__dirname, "template", "prompt.html"),
      {
        requestId,
        requestedScopes,
        clientName,
        allowRememberMe,
        errorObject,
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
    if (body.choice === "deny") {
      const { redirectUriWithAccessDeniedErrorAndState } =
        await this.authorizationService.ownerDenied({
          requestId: body.request_id,
        });

      return {
        url: redirectUriWithAccessDeniedErrorAndState,
        statusCode: HttpStatus.FOUND,
      } satisfies HttpRedirectResponse;
    }

    if (body.choice === "authorize") {
      try {
        const { redirectUriWithAuthorizationCodeAndState } =
          await this.authorizationService.ownerAuthorized({
            requestId: body.request_id,
            credentials: {
              email: body.email,
              password: body.password,
              rememberMe: body.remember_me || false,
            },
          });

        return {
          url: redirectUriWithAuthorizationCodeAndState,
          statusCode: HttpStatus.FOUND,
        } satisfies HttpRedirectResponse;
      } catch (error) {
        if (error instanceof OauthInvalidCredentialsException) {
          return {
            url: `/oauth/prompt?request_id=${body.request_id}&error=${error.errorCode}`,
            statusCode: HttpStatus.FOUND,
          } satisfies HttpRedirectResponse;
        }
        if (error instanceof OauthInvalidRequestException) {
          return {
            url: `/oauth/prompt?request_id=${body.request_id}&error=${error.errorCode}`,
            statusCode: HttpStatus.FOUND,
          } satisfies HttpRedirectResponse;
        }
        throw error;
      }
    }

    throw new BadRequestException("Unknown user choice");
  }

  @Post("token")
  @ApiOperation({
    summary: "OAuth2 Token Endpoint",
    description:
      "Exchanges authorization code for tokens or refreshes access tokens",
  })
  @ApiResponse({
    status: 200,
    description: "Token response",
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request parameters",
  })
  @ApiResponse({
    status: 401,
    description: "Invalid authorization code or credentials",
  })
  async token(@Body() body: TokenRequestDto): Promise<TokenResponseDto> {
    if (body.grant_type === "authorization_code") {
      const {
        idToken,
        refreshToken,
        accessToken,
        expiresIn,
        scope,
        tokenType,
      } = await this.authorizationService.codeExchange({
        clientId: body.client_id,
        code: body.code,
        codeVerifier: body.code_verifier,
      });

      return {
        id_token: idToken,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        scope,
        token_type: tokenType,
      } satisfies TokenResponseDto;
    }
    if (body.grant_type === "refresh_token") {
      throw new Error("Not implemented");
    }
    throw new Error("Not implemented");
  }
}
