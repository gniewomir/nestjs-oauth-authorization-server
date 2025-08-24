import { Inject, Injectable } from "@nestjs/common";

import { Assert } from "@domain/Assert";
import { AuthorizationFacade } from "@domain/auth/Authorization.facade";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import {
  CodeInterface,
  CodeInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import {
  IntentEnum,
  IntentValue,
} from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { CodeChallengeValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeValue";
import {
  PKCEInterface,
  PKCEInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import {
  RequestInterface,
  RequestInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { StateValue } from "@domain/auth/OAuth/Authorization/StateValue";
import {
  ClientInterface,
  ClientInterfaceSymbol,
} from "@domain/auth/OAuth/Client/Client.interface";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import {
  OauthAccessDeniedException,
  OauthInvalidRequestException,
  OauthRedirectUriMismatchException,
  OauthServerErrorException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValue, ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import {
  TokenPayloadInterfaceSymbol,
  TokenPayloadsInterface,
} from "@domain/auth/OAuth/Token";
import { UsersInterface, UsersInterfaceSymbol } from "@domain/auth/OAuth/User";
import {
  EmailSanitizerInterface,
  EmailSanitizerInterfaceSymbol,
  EmailValue,
  PasswordInterface,
  PasswordInterfaceSymbol,
  PasswordValue,
} from "@domain/auth/OAuth/User/Credentials";
import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";
import {
  AuthorizeRequestDto,
  PromptShowRequestDto,
} from "@interface/api/oauth/dto";
import { assert } from "@interface/api/utility/assert";

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly authConfig: AuthConfig,
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
    @Inject(RequestInterfaceSymbol)
    private readonly requests: RequestInterface,
    @Inject(ClientInterfaceSymbol)
    private readonly clients: ClientInterface,
    @Inject(UsersInterfaceSymbol)
    private readonly users: UsersInterface,
    @Inject(CodeInterfaceSymbol)
    private readonly codes: CodeInterface,
    @Inject(PasswordInterfaceSymbol)
    private readonly passwords: PasswordInterface,
    @Inject(PKCEInterfaceSymbol)
    private readonly pkce: PKCEInterface,
    @Inject(TokenPayloadInterfaceSymbol)
    private readonly tokenPayloads: TokenPayloadsInterface,
    @Inject(EmailSanitizerInterfaceSymbol)
    private readonly emailSanitizer: EmailSanitizerInterface,
  ) {}

  async createAuthorizationRequest({
    client_id,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    intent,
    redirect_uri,
  }: AuthorizeRequestDto) {
    const request = await AuthorizationFacade.request(
      {
        clientId: IdentityValue.fromString(client_id),
        responseType: ResponseTypeValue.fromString(response_type),
        id: IdentityValue.create(),
        scope: scope
          ? ScopeValueImmutableSet.fromString(scope)
          : ScopeValueImmutableSet.fromArray([]),
        state: state ? StateValue.fromUnknown(state) : null,
        codeChallenge: CodeChallengeValue.fromUnknown(code_challenge),
        codeChallengeMethod: CodeChallengeMethodValue.fromUnknown(
          code_challenge_method,
        ),
        intent: intent ? IntentValue.fromString(intent) : null,
        redirectUri: redirect_uri
          ? RedirectUriValue.create(redirect_uri, this.appConfig.nodeEnv)
          : null,
      },
      this.requests,
      this.clients,
    );

    return {
      request_id: request.id.toString(),
      intent: request.intent ? request.intent.toString() : undefined,
    };
  }

  async prepareAuthorizationPrompt({
    request_id,
    email,
    intent,
  }: PromptShowRequestDto) {
    Assert(
      IntentValue.isValid(intent),
      () =>
        new OauthInvalidRequestException({
          message: `Invalid intent value`,
        }),
    );
    const request = await NotFoundToDomainException(
      () => this.requests.retrieve(IdentityValue.fromString(request_id)),
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Authorization request not found`,
        }),
    );
    const client = await NotFoundToDomainException(
      () => this.clients.retrieve(request.clientId),
      (error) =>
        new OauthServerErrorException({
          message: error.message,
        }),
    );

    const accessDeniedUrl = request.redirectUri.toURL();
    if (request.state) {
      accessDeniedUrl.searchParams.set("state", request.state.toString());
    }
    accessDeniedUrl.searchParams.set(
      "error",
      OauthAccessDeniedException.ERROR_CODE,
    );

    return {
      allowRememberMe: request.scope.hasScope(
        ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL(),
      ),
      requestedScopes: request.scope.describe(),
      clientName: client.name,
      accessDeniedUrl: accessDeniedUrl.toString(),
      sanitizedEmail: email
        ? EmailValue.create(email, this.emailSanitizer).toString()
        : undefined,
      form: {
        [IntentEnum.AUTHORIZE_NEW_USER]: "register",
        [IntentEnum.AUTHORIZE_EXISTING_USER]: "authorize",
        default: "choice",
      }[intent || "default"] as "register" | "authorize" | "choice",
    };
  }

  async ownerAuthorized(params: {
    requestId: string;
    credentials: {
      email: string;
      password: string;
      rememberMe?: boolean;
    };
  }): Promise<{
    redirectUriWithAuthorizationCodeAndState: string;
  }> {
    const request = await AuthorizationFacade.authorizePrompt(
      {
        requestId: IdentityValue.fromString(params.requestId),
        credentials: {
          email: EmailValue.create(
            params.credentials.email,
            this.emailSanitizer,
          ),
          password: PasswordValue.fromString(params.credentials.password),
          rememberMe: params.credentials.rememberMe || false,
        },
      },
      this.requests,
      this.users,
      this.passwords,
      this.codes,
      this.clock,
      this.authConfig,
    );

    Assert(request.authorizationCode instanceof Code);

    const redirect = new URL(request.redirectUri.toString());
    redirect.searchParams.set("code", request.authorizationCode.toString());
    if (request.state) {
      redirect.searchParams.set("state", request.state.toString());
    }

    return {
      redirectUriWithAuthorizationCodeAndState: redirect.toString(),
    };
  }

  async ownerDenied({ requestId }: { requestId: string }): Promise<{
    redirectUriWithAccessDeniedErrorAndState: string;
  }> {
    const request = await NotFoundToDomainException(
      () => this.requests.retrieve(IdentityValue.fromUnknown(requestId)),
      () =>
        new OauthInvalidRequestException({
          message: `Authorization request not found`,
        }),
    );

    const redirect = request.redirectUri.toURL();
    redirect.searchParams.set("error", "access_denied");
    if (request.state) {
      redirect.searchParams.set("state", request.state.toString());
    }

    return {
      redirectUriWithAccessDeniedErrorAndState: redirect.toString(),
    };
  }

  async grantAuthorizationCode({
    clientId,
    code,
    codeVerifier,
    redirectUri,
  }: {
    clientId: string;
    code: string | undefined;
    codeVerifier: string | undefined;
    redirectUri: string | undefined;
  }) {
    assert(
      IdentityValue.isValid(clientId),
      () =>
        new OauthInvalidRequestException({
          errorDescription: "Invalid client ID",
        }),
    );

    assert(
      typeof code === "string" && code.length > 0,
      () =>
        new OauthInvalidRequestException({
          errorDescription: "No authorization code",
        }),
    );

    assert(
      (typeof codeVerifier === "string" && codeVerifier.length > 0) ||
        this.appConfig.nodeEnv !== "production",
      () =>
        new OauthInvalidRequestException({
          errorDescription: "No code verifier",
        }),
    );

    // If redirect_uri is provided, validate it against the client's registered redirect URI
    if (redirectUri) {
      const client = await NotFoundToDomainException(
        () => this.clients.retrieve(IdentityValue.fromString(clientId)),
        (error) =>
          new OauthServerErrorException({
            message: error.message,
          }),
      );

      const providedRedirectUri = RedirectUriValue.fromString(redirectUri);
      Assert(
        client.redirectUri.isEqual(providedRedirectUri),
        () =>
          new OauthRedirectUriMismatchException({
            errorDescription:
              "The redirect_uri provided in the request does not match the redirect_uri registered for the client application.",
          }),
      );
    }

    const { accessToken, idToken, expiresIn, refreshToken, scope } =
      await AuthorizationFacade.authorizationCodeGrant(
        {
          clientId: IdentityValue.fromString(clientId),
          code: code,
          codeVerifier: codeVerifier || "",
        },
        this.requests,
        this.pkce,
        this.clock,
        this.authConfig,
        this.users,
        this.tokenPayloads,
        this.clients,
      );

    return {
      accessToken,
      refreshToken,
      idToken,
      expiresIn,
      scope: scope.toString(),
      tokenType: "Bearer",
    };
  }

  public async grantRefreshToken({
    refreshToken,
  }: {
    refreshToken: string | undefined;
  }) {
    assert(
      typeof refreshToken === "string" && refreshToken.length > 0,
      () =>
        new OauthInvalidRequestException({
          errorDescription: "No refresh token in request",
        }),
    );

    const {
      accessToken,
      refreshToken: newRefreshToken,
      idToken,
      expiresAt,
      scope,
    } = await AuthorizationFacade.refreshTokenGrant(
      refreshToken,
      this.tokenPayloads,
      this.clock,
      this.authConfig,
      this.users,
      this.clients,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      idToken,
      expiresIn: expiresAt - this.clock.nowAsSecondsSinceEpoch(),
      scope: scope.toString(),
      tokenType: "Bearer",
    };
  }

  async register(params: { email: string; password: string }): Promise<{
    userId: string;
    email: string;
    emailVerified: boolean;
  }> {
    const email = EmailValue.create(params.email, this.emailSanitizer);
    const password = PasswordValue.fromString(params.password);

    const result = await AuthorizationFacade.registerPrompt(
      { email, password },
      this.users,
      this.passwords,
    );

    return {
      userId: result.identity.toString(),
      email: result.user.email.toString(),
      emailVerified: result.user.emailVerified,
    };
  }

  async show(params: { userId: string }): Promise<{
    userId: string;
    email: string;
    emailVerified: boolean;
  }> {
    const user = await NotFoundToDomainException(
      () => this.users.retrieve(IdentityValue.fromString(params.userId)),
      () => new Error(`User with ID ${params.userId} not found`),
    );

    return {
      userId: user.identity.toString(),
      email: user.email.toString(),
      emailVerified: user.emailVerified,
    };
  }
}
