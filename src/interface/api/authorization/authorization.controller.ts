import * as path from "node:path";

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpRedirectResponse,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Post,
  Query,
  Redirect,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { AuthorizationService } from "@application/authorization/authorization.service";
import { Assert } from "@domain/Assert";
import {
  OauthException,
  OauthInvalidCredentialsException,
  OauthInvalidRequestException,
  OauthUnsupportedGrantTypeException,
} from "@domain/authentication/OAuth/Errors";
import { IdentityValue } from "@domain/IdentityValue";
import { AppConfig } from "@infrastructure/config/configs";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";
import { TemplateService } from "@infrastructure/template/template.service";
import { TemplateInterfaceSymbol } from "@interface/api/authorization/Template.interface";

import { AuthorizeRequestDto } from "./dto/authorize-request.dto";
import { PromptRequestDto } from "./dto/prompt-request.dto";
import { TokenRequestDto } from "./dto/token-request.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@ApiTags("OAuth2 Authorization")
@Controller("oauth")
export class AuthorizationController {
  constructor(
    @Inject(LoggerInterfaceSymbol) private readonly logger: LoggerInterface,
    private readonly appConfig: AppConfig,
    private readonly authorizationService: AuthorizationService,
    @Inject(TemplateInterfaceSymbol)
    private readonly templateService: TemplateService,
  ) {
    this.logger.setContext("AuthorizationController");
  }

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
    const request = await this.authorizationService.createAuthorizationRequest({
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
  async prompt(
    @Query("request_id") requestId: string,
    @Query("error") error?: string,
  ): Promise<string> {
    try {
      const { requestedScopes, clientName, allowRememberMe } =
        await this.authorizationService.prepareAuthorizationPrompt({
          requestId,
        });

      const errorObject = {
        [OauthInvalidCredentialsException.DEFAULT_CODE]: {
          errorCode: OauthInvalidCredentialsException.DEFAULT_CODE,
          errorMessage: "Provided credentials does not match our records.",
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
    } catch (error) {
      this.logger.error("Error during preparing OAuth prompt", error);
      return this.renderErrorPage(error);
    }
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
  async submitPrompt(@Body() body: PromptRequestDto) {
    if (body.choice === "deny") {
      try {
        const { redirectUriWithAccessDeniedErrorAndState } =
          await this.authorizationService.ownerDenied({
            requestId: body.request_id,
          });

        return {
          url: redirectUriWithAccessDeniedErrorAndState,
          statusCode: HttpStatus.FOUND,
        } satisfies HttpRedirectResponse;
      } catch (error) {
        this.logger.info(
          "Unhandled error during submitting OAuth prompt submission (denied)",
          error,
        );
        return this.renderErrorPage(error);
      }
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
          this.logger.warn(
            "Handled error during submitting OAuth prompt",
            error,
          );
          return {
            url: `/oauth/prompt?request_id=${body.request_id}&error=${error.errorCode}`,
            statusCode: HttpStatus.FOUND,
          } satisfies HttpRedirectResponse;
        }
        if (error instanceof OauthInvalidRequestException) {
          this.logger.warn(
            "Handled error during submitting OAuth prompt",
            error,
          );
          return {
            url: `/oauth/prompt?request_id=${body.request_id}&error=${error.errorCode}`,
            statusCode: HttpStatus.FOUND,
          } satisfies HttpRedirectResponse;
        }
        this.logger.error(
          "Unhandled error during submitting OAuth prompt submission (authorized)",
          error,
        );
        return this.renderErrorPage(
          error,
          `/oauth/prompt?request_id=${body.request_id}`,
        );
      }
    }

    throw new BadRequestException("Unknown user choice");
  }

  private renderErrorPage(exception: unknown, returnUrl?: string) {
    Assert(exception instanceof Error);

    const serializeException = (exception: Error) => {
      // @ts-expect-error format stack in more readable way, without overthinking it
      exception.stack = exception.stack
        ? exception.stack.split("\n").map((str) => str.trim())
        : exception.stack;
      return this.appConfig.env === "development"
        ? JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2)
        : undefined;
    };

    if (exception instanceof OauthException) {
      return this.templateService.renderTemplate(
        path.join(__dirname, "template", "error.html"),
        {
          errorCode: exception.statusCode,
          errorTitle: exception.errorCode,
          errorDescription: exception.errorDescription,
          errorDetails: serializeException(exception),
          returnUrl: returnUrl,
        },
      );
    }

    if (exception instanceof HttpException) {
      return this.templateService.renderTemplate(
        path.join(__dirname, "template", "error.html"),
        {
          errorCode: exception.getStatus(),
          errorTitle: exception.name,
          errorDetails: serializeException(exception),
          returnUrl: returnUrl,
        },
      );
    }

    return this.templateService.renderTemplate(
      path.join(__dirname, "template", "error.html"),
      {
        errorCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorTitle: InternalServerErrorException.name,
        errorDetails: serializeException(exception),
        returnUrl: returnUrl,
      },
    );
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
      Assert(
        IdentityValue.isValid(body.client_id),
        () =>
          new OauthInvalidRequestException({
            errorDescription: "Invalid client ID",
          }),
      );

      Assert(
        typeof body.code === "string" && body.code.length > 0,
        () =>
          new OauthInvalidRequestException({
            errorDescription: "No authorization code",
          }),
      );

      Assert(
        typeof body.code_verifier === "string" ||
          this.appConfig.env !== "production",
        () =>
          new OauthInvalidRequestException({
            errorDescription: "No code verifier",
          }),
      );

      const {
        idToken,
        refreshToken,
        accessToken,
        expiresIn,
        scope,
        tokenType,
      } = await this.authorizationService.grantAuthorizationCode({
        clientId: body.client_id,
        code: body.code,
        codeVerifier: body.code_verifier || "",
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
      Assert(
        typeof body.refresh_token === "string" && body.refresh_token.length > 0,
        () =>
          new OauthInvalidRequestException({
            errorDescription: "No refresh token in request",
          }),
      );

      const {
        idToken,
        refreshToken,
        accessToken,
        expiresIn,
        scope,
        tokenType,
      } = await this.authorizationService.grantRefreshToken({
        refreshToken: body.refresh_token,
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
    throw new OauthUnsupportedGrantTypeException();
  }
}
