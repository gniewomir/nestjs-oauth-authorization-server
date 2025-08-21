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
import {
  OauthInvalidCredentialsException,
  OauthInvalidRequestException,
  OauthUnsupportedGrantTypeException,
} from "@domain/auth/OAuth/Errors";
import { IdentityValue } from "@domain/IdentityValue";
import { AppConfig, HtmlConfig } from "@infrastructure/config/configs";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";
import { DefaultLayoutService } from "@infrastructure/template";
import { assert } from "@interface/api/utility/assert";
import { exceptionAsJsonString } from "@interface/api/utility/exception";
import {
  isEmailErrorCode,
  isPasswordErrorCode,
  isValidErrorCode,
  userErrorCodeToMessage,
} from "@interface/api/utility/user.error";

import { AuthorizeRequestDto } from "./dto/authorize-request.dto";
import { PromptRequestDto } from "./dto/prompt-request.dto";
import { TokenRequestDto } from "./dto/token-request.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@ApiTags("OAuth2 Authorization")
@Controller("oauth")
export class OauthController {
  constructor(
    @Inject(LoggerInterfaceSymbol) private readonly logger: LoggerInterface,
    private readonly appConfig: AppConfig,
    private readonly authorizationService: AuthorizationService,
    private readonly defaultLayoutService: DefaultLayoutService,
    private readonly htmlConfig: HtmlConfig,
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

      assert(
        (error && isValidErrorCode(error)) || typeof error === "undefined",
        () => new BadRequestException("Invalid error code!"),
      );

      return this.defaultLayoutService.renderPageBuilder(
        this.defaultLayoutService
          .createPageBuilder()
          .header({
            title: `Authorization Required | ${this.htmlConfig.projectTitle}`,
            headerTitle: "Authorization Required",
            headerSubtitle: `Application "${clientName}" is requesting access to your account`,
          })
          .form({
            formTitle: "Sign In",
            formId: "authorize",
            formAction: "/oauth/prompt",
            formHiddenFields: [
              {
                name: "request_id",
                value: requestId,
              },
            ],
            formFields: [
              {
                id: "email",
                name: "email",
                type: "email",
                label: "Email Address",
                required: true,
                error: isEmailErrorCode(error)
                  ? userErrorCodeToMessage(error)
                  : undefined,
              },
              {
                id: "password",
                name: "password",
                type: "password",
                label: "Password",
                required: true,
                error: isPasswordErrorCode(error)
                  ? userErrorCodeToMessage(error)
                  : undefined,
              },
            ],
            rememberMe: allowRememberMe,
            infoBox: {
              title: "Permissions",
              items: requestedScopes.map(({ humanName, description }) => ({
                name: humanName,
                description,
              })),
            },
            formActions: [
              {
                name: "choice",
                value: "authorize",
                class: "btn-primary",
                id: "authorizeBtn",
                text: "Authorize",
              },
              {
                name: "choice",
                value: "deny",
                class: "btn-secondary",
                id: "denyBtn",
                text: "Deny",
              },
            ],
          }),
      );
    } catch (error) {
      return this.logAndRenderErrorPage(error);
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
        return this.logAndRenderErrorPage(error);
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
        return this.logAndRenderErrorPage(
          error,
          `/oauth/prompt?request_id=${body.request_id}`,
        );
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
      assert(
        IdentityValue.isValid(body.client_id),
        () =>
          new OauthInvalidRequestException({
            errorDescription: "Invalid client ID",
          }),
      );

      assert(
        typeof body.code === "string" && body.code.length > 0,
        () =>
          new OauthInvalidRequestException({
            errorDescription: "No authorization code",
          }),
      );

      assert(
        typeof body.code_verifier === "string" ||
          this.appConfig.nodeEnv !== "production",
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
      assert(
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

  private logAndRenderErrorPage(exception: unknown, returnUrl?: string) {
    assert(
      exception instanceof Error,
      () =>
        new InternalServerErrorException(
          "Error page received value that is not instance of Error",
          {
            cause: exception,
          },
        ),
    );

    this.logger.error("Error in OAuth controller", exception);

    if (exception instanceof HttpException) {
      return this.defaultLayoutService.renderPageBuilder(
        this.defaultLayoutService
          .createPageBuilder()
          .header({
            title: `Error | ${this.htmlConfig.projectTitle}`,
            headerTitle: "Oops! Something went wrong",
            headerSubtitle: "We encountered an unexpected error",
          })
          .error({
            errorMessage: "Error has been logged. We are looking into it",
            errorName: exception.name,
            errorStatus: exception.getStatus(),
            errorDetails: exceptionAsJsonString(exception, this.appConfig),
          })
          .actions({
            actions: returnUrl
              ? [
                  {
                    class: "btn-primary",
                    href: returnUrl,
                    text: "Return",
                  },
                ]
              : [],
          }),
      );
    }

    return this.defaultLayoutService.renderPageBuilder(
      this.defaultLayoutService
        .createPageBuilder()
        .header({
          title: `Error | ${this.htmlConfig.projectTitle}`,
          headerTitle: "Oops! Something went wrong",
          headerSubtitle: "We encountered an unexpected error",
        })
        .error({
          errorMessage: "Error has been logged. We are looking into it",
          errorName: InternalServerErrorException.name,
          errorStatus: HttpStatus.INTERNAL_SERVER_ERROR,
          errorDetails: exceptionAsJsonString(exception, this.appConfig),
        })
        .actions({
          actions: returnUrl
            ? [
                {
                  class: "btn-primary",
                  href: returnUrl,
                  text: "Return",
                },
              ]
            : [],
        }),
    );
  }
}
