import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { AuthorizationService } from "@application/authorization/authorization.service";
import { IntentEnum } from "@domain/auth/OAuth/Authorization/IntentValue";
import { OauthUnsupportedGrantTypeException } from "@domain/auth/OAuth/Errors";
import { UserException } from "@domain/auth/OAuth/User/Errors/UserException";
import { AppConfig, HtmlConfig } from "@infrastructure/config/configs";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";
import { CsrfService } from "@infrastructure/security/csrf";
import { DefaultLayoutService } from "@infrastructure/template";
import {
  isEmailErrorCode,
  isPasswordErrorCode,
  isValidErrorCode,
  userErrorCodeToMessage,
} from "@interface/api/utility";
import { assert } from "@interface/api/utility/assert";
import { exceptionAsJsonString } from "@interface/api/utility/exception";

import {
  AuthorizeRequestDto,
  PromptRequestDto,
  TokenRequestDto,
  TokenResponseDto,
} from "./dto";

@ApiTags("OAuth2 Authorization")
@Controller("oauth")
export class OauthController {
  constructor(
    @Inject(LoggerInterfaceSymbol) private readonly logger: LoggerInterface,
    private readonly appConfig: AppConfig,
    private readonly authorizationService: AuthorizationService,
    private readonly defaultLayoutService: DefaultLayoutService,
    private readonly htmlConfig: HtmlConfig,
    private readonly csrfService: CsrfService,
  ) {
    this.logger.setContext("AuthorizationController");
  }

  @Get("authorize")
  @ApiOperation({
    summary: "OAuth2 Authorization Endpoint",
    description: "Initiates OAuth2 Authorization Code flow with PKCE",
  })
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
    const { request_id, intent } =
      await this.authorizationService.createAuthorizationRequest(query);

    res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      this.createRedirectString(`/oauth/prompt`, {
        request_id,
        intent,
      }),
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
  @Header("content-type", "text/html")
  async prompt(
    @Query("request_id") requestId: string,
    @Query("error") error?: string,
    @Query("intent") intent?: string,
    @Query("email") email?: string,
  ): Promise<string> {
    assert(
      (error && isValidErrorCode(error)) || typeof error === "undefined",
      () => new BadRequestException("Invalid error code!"),
    );

    const {
      requestedScopes,
      clientName,
      allowRememberMe,
      accessDeniedUrl,
      sanitizedEmail,
    } = await this.authorizationService.prepareAuthorizationPrompt({
      requestId,
      email,
    });

    // Generate CSRF token for this request
    const csrfToken = this.csrfService.generateToken(requestId);

    const form = {
      [IntentEnum.AUTHORIZE_NEW_USER]: "register",
      [IntentEnum.AUTHORIZE_EXISTING_USER]: "authorize",
      default: "choice",
    }[intent || "default"] as "register" | "authorize" | "choice";

    try {
      if (form === "choice") {
        return this.defaultLayoutService.renderPageBuilder(
          this.defaultLayoutService
            .createPageBuilder()
            .header({
              title: `Action Required | ${this.htmlConfig.projectTitle}`,
              headerTitle: "Action Required",
              headerSubtitle: `Application "${clientName}" is requesting access to your account`,
            })
            .nextSteps({
              nextSteps: [
                {
                  text: "Authorize, if you already have an account",
                },
                {
                  text: "Register, if you don't",
                },
                {
                  text: "Return, if you don't know how you ended on this page",
                },
              ],
            })
            .actions({
              actions: [
                {
                  href: `/oauth/prompt?request_id=${requestId}&intent=${IntentEnum.AUTHORIZE_EXISTING_USER}`,
                  class: "btn-primary",
                  text: "Authorize",
                },
                {
                  href: `/oauth/prompt?request_id=${requestId}&intent=${IntentEnum.AUTHORIZE_NEW_USER}`,
                  class: "btn-primary",
                  text: "Register",
                },
                {
                  href: accessDeniedUrl,
                  class: "btn-secondary",
                  text: "Return",
                },
              ],
            }),
        );
      }

      if (form === "authorize") {
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
              formAction: `/oauth/prompt`,
              formHiddenFields: [
                {
                  name: "request_id",
                  value: requestId,
                },
                {
                  name: "intent",
                  value: IntentEnum.AUTHORIZE_EXISTING_USER,
                },
                {
                  name: "_csrf",
                  value: csrfToken,
                },
              ],
              formFields: [
                {
                  id: "email",
                  name: "email",
                  type: "email",
                  label: "Email Address",
                  required: false,
                  error: isEmailErrorCode(error)
                    ? userErrorCodeToMessage(error)
                    : undefined,
                  value: sanitizedEmail ? sanitizedEmail : undefined,
                },
                {
                  id: "password",
                  name: "password",
                  type: "password",
                  label: "Password",
                  required: false,
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
      }

      if (form === "register") {
        return await this.defaultLayoutService.renderPageBuilder(
          this.defaultLayoutService
            .createPageBuilder()
            .header({
              title: `User Registration | ${this.htmlConfig.projectTitle}`,
              headerTitle: "Create Account",
              headerSubtitle: `Gain access to our services`,
            })
            .form({
              formAction: `/oauth/prompt`,
              formTitle: "Register",
              formId: "authorize",
              formHiddenFields: [
                {
                  name: "request_id",
                  value: requestId,
                },
                {
                  name: "intent",
                  value: IntentEnum.AUTHORIZE_NEW_USER,
                },
                {
                  name: "_csrf",
                  value: csrfToken,
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
                  value: sanitizedEmail ? sanitizedEmail : undefined,
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
              infoBox: {
                title: "Account Information",
                items: [
                  {
                    name: "•",
                    description:
                      "Your email will be used for account verification",
                  },
                  {
                    name: "•",
                    description:
                      "Password must have 12 or more characters - and half needs to be unique",
                  },
                  {
                    name: "•",
                    description: "You can update your information later",
                  },
                ],
              },
              formActions: [
                {
                  name: "action",
                  value: "create",
                  class: "btn-primary",
                  id: "createBtn",
                  text: "Create Account",
                },
              ],
            }),
        );
      }

      throw new BadRequestException("Unknown user intent!");
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
  @Header("content-type", "text/html")
  async submitPrompt(
    @Body() body: PromptRequestDto,
    @Res() response: Response,
  ) {
    if (body.intent === IntentEnum.AUTHORIZE_EXISTING_USER.toString()) {
      if (body.choice === "deny") {
        try {
          const { redirectUriWithAccessDeniedErrorAndState } =
            await this.authorizationService.ownerDenied({
              requestId: body.request_id,
            });

          response.redirect(redirectUriWithAccessDeniedErrorAndState);
        } catch (error) {
          if (error instanceof UserException) {
            this.logger.warn("Error during prompt submission", error);

            response.redirect(
              this.createRedirectString("/oauth/prompt", {
                request_id: body.request_id,
                intent: IntentEnum.AUTHORIZE_EXISTING_USER.toString(),
                error: error.errorCode,
              }),
            );
            return;
          }
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

          response.redirect(redirectUriWithAuthorizationCodeAndState);
        } catch (error) {
          if (error instanceof UserException) {
            this.logger.warn("Error during prompt submission", error);

            response.redirect(
              this.createRedirectString("/oauth/prompt", {
                request_id: body.request_id,
                intent: IntentEnum.AUTHORIZE_EXISTING_USER.toString(),
                error: error.errorCode,
                email: body.email,
              }),
            );
            return;
          }
          return this.logAndRenderErrorPage(error);
        }
      }

      throw new BadRequestException(
        "Unknown user choice - whether he authorized or denied authorization request",
      );
    }
    if (body.intent === IntentEnum.AUTHORIZE_NEW_USER.toString()) {
      try {
        await this.authorizationService.register({
          email: body.email,
          password: body.password,
        });

        response.redirect(
          this.createRedirectString("/oauth/prompt", {
            request_id: body.request_id,
            intent: IntentEnum.AUTHORIZE_NEW_USER.toString(),
          }),
        );
      } catch (error) {
        if (error instanceof UserException) {
          this.logger.warn(
            "Error during prompt submission",
            exceptionAsJsonString(error),
          );
          response.redirect(
            this.createRedirectString("/oauth/prompt", {
              request_id: body.request_id,
              intent: IntentEnum.AUTHORIZE_NEW_USER.toString(),
              error: error.errorCode,
              email: body.email,
            }),
          );
          return;
        }
        return this.logAndRenderErrorPage(error);
      }
    }
    throw new BadRequestException(
      "Unknown user intent - whether he submitted authorization or registration form",
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
  @Header("content-type", "application/json")
  async token(@Body() body: TokenRequestDto): Promise<TokenResponseDto> {
    if (body.grant_type === "authorization_code") {
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
        codeVerifier: body.code_verifier,
        redirectUri: body.redirect_uri,
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

    this.logger.error(
      "Error in OAuth controller",
      exceptionAsJsonString(exception),
    );

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
            errorDetails:
              this.appConfig.nodeEnv !== "production"
                ? exceptionAsJsonString(exception)
                : undefined,
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
          errorDetails:
            this.appConfig.nodeEnv !== "production"
              ? exceptionAsJsonString(exception)
              : undefined,
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

  private createRedirectString(
    path: string,
    query: {
      request_id: string;
      intent?: string;
      error?: string;
      email?: string;
    },
  ) {
    assert(
      path.startsWith("/"),
      () => new Error('Redirect URL path should start with "/"'),
    );
    assert(
      !path.includes("?") && !path.includes("&"),
      () => new Error("Redirect URL path should not contain query string"),
    );
    const queryString = Object.entries(query)
      .map(([key, val]) => [key, encodeURIComponent(val)])
      .map(([key, val]) => (val ? `${key}=${val}` : undefined))
      .filter((val) => val !== undefined)
      .join("&");
    return `${path}?${queryString}`;
  }
}
