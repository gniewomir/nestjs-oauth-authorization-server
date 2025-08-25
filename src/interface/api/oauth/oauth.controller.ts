import {
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
import {
  OauthInvalidRequestException,
  OauthUnsupportedGrantTypeException,
} from "@domain/auth/OAuth/Errors";
import { AppConfig, HtmlConfig } from "@infrastructure/config/configs";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";
import { CsrfService } from "@infrastructure/security/csrf";
import { DefaultLayoutService } from "@infrastructure/template";
import { authorizePage } from "@interface/api/oauth/page/authorize.page";
import { choicePage } from "@interface/api/oauth/page/choice.page";
import { registerPage } from "@interface/api/oauth/page/register.page";
import { assert } from "@interface/api/utility/assert";
import { exceptionAsJsonString } from "@interface/api/utility/exception";

import {
  AuthorizeRequestDto,
  PromptShowRequestDto,
  PromptSubmitRequestDto,
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
  async prompt(@Query() query: PromptShowRequestDto): Promise<string> {
    const csrfToken = this.csrfService.generateToken(query.request_id);
    const {
      requestedScopes,
      clientName,
      allowRememberMe,
      accessDeniedUrl,
      sanitizedEmail,
      form,
    } = await this.authorizationService.prepareAuthorizationPrompt(query);

    if (form === "authorize") {
      return this.defaultLayoutService.renderPageBuilder(
        authorizePage(
          {
            clientName,
            title: this.htmlConfig.projectTitle,
            requestId: query.request_id,
            allowRememberMe,
            sanitizedEmail,
            error: query.error,
            csrfToken,
            requestedScopes,
          },
          this.defaultLayoutService.createPageBuilder(),
        ),
      );
    }

    if (form === "register") {
      return await this.defaultLayoutService.renderPageBuilder(
        registerPage(
          {
            title: this.htmlConfig.projectTitle,
            requestId: query.request_id,
            sanitizedEmail,
            error: query.error,
            csrfToken,
          },
          this.defaultLayoutService.createPageBuilder(),
        ),
      );
    }

    return this.defaultLayoutService.renderPageBuilder(
      choicePage(
        {
          clientName,
          accessDeniedUrl,
          title: this.htmlConfig.projectTitle,
          authorizeUrl: this.createRedirectString("/oauth/prompt", {
            request_id: query.request_id,
            intent: IntentEnum.AUTHORIZE_EXISTING_USER,
          }),
          registerUrl: this.createRedirectString("/oauth/prompt", {
            request_id: query.request_id,
            intent: IntentEnum.AUTHORIZE_NEW_USER,
          }),
        },
        this.defaultLayoutService.createPageBuilder(),
      ),
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
  @Header("content-type", "text/html")
  async submitPrompt(
    @Body() body: PromptSubmitRequestDto,
    @Res() response: Response,
  ) {
    this.csrfService.validateToken(body.request_id, body._csrf);

    if (
      body.intent === IntentEnum.AUTHORIZE_EXISTING_USER.toString() &&
      body.choice === "deny"
    ) {
      const { redirect } = await this.authorizationService.ownerDenied(body);
      response.redirect(redirect);
      return;
    }

    if (
      body.intent === IntentEnum.AUTHORIZE_EXISTING_USER.toString() &&
      body.choice === "authorize"
    ) {
      const { redirect, error, request_id, intent } =
        await this.authorizationService.ownerAuthorized(body);

      if (redirect) {
        response.redirect(redirect);
        return;
      }

      response.redirect(
        this.createRedirectString("/oauth/prompt", {
          request_id,
          error,
          intent,
        }),
      );

      return;
    }

    if (body.intent === IntentEnum.AUTHORIZE_NEW_USER.toString()) {
      const { request_id, intent, sanitizedEmail, error } =
        await this.authorizationService.register(body);

      if (!error) {
        response.redirect(
          this.createRedirectString("/oauth/prompt", {
            request_id,
            intent: IntentEnum.AUTHORIZE_NEW_USER.toString(),
            email: sanitizedEmail,
          }),
        );
        return;
      }

      response.redirect(
        this.createRedirectString("/oauth/prompt", {
          request_id,
          intent,
          email: sanitizedEmail,
          error,
        }),
      );
      return;
    }

    throw new OauthInvalidRequestException();
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
