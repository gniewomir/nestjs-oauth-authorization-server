import { Inject, Injectable } from "@nestjs/common";

import { Assert } from "@domain/Assert";
import { AuthorizationFacade } from "@domain/auth/Authorization.facade";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import {
  CodeInterface,
  CodeInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { IntentValue } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import {
  PKCEInterface,
  PKCEInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import {
  RequestInterface,
  RequestInterfaceSymbol,
} from "@domain/auth/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import {
  ClientInterface,
  ClientInterfaceSymbol,
} from "@domain/auth/OAuth/Client/Client.interface";
import {
  OauthAccessDeniedException,
  OauthInvalidRequestException,
  OauthServerErrorException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import {
  TokenPayloadInterfaceSymbol,
  TokenPayloadsInterface,
} from "@domain/auth/OAuth/Token/TokenPayloads.interface";
import {
  EmailSanitizerInterface,
  EmailSanitizerInterfaceSymbol,
} from "@domain/auth/OAuth/User/Credentials/EmailSanitizer.interface";
import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import {
  PasswordInterface,
  PasswordInterfaceSymbol,
} from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/auth/OAuth/User/Credentials/PasswordValue";
import {
  UsersInterface,
  UsersInterfaceSymbol,
} from "@domain/auth/OAuth/User/Users.interface";
import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";
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
    clientId,
    responseType,
    scope,
    state,
    codeChallenge,
    codeChallengeMethod,
    intent,
  }: {
    clientId: string;
    responseType: string;
    scope?: string;
    state?: string;
    codeChallengeMethod?: string;
    codeChallenge?: string;
    intent?: string;
  }) {
    Assert(
      IdentityValue.isValid(clientId),
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Client ID is invalid or missing`,
        }),
    );
    Assert(
      this.appConfig.nodeEnv !== "production" ||
        Boolean(
          codeChallenge &&
            CodeChallengeMethodValue.fromUnknown(codeChallengeMethod).isEqual(
              CodeChallengeMethodValue.METHOD_S256(),
            ),
        ),
      () =>
        new OauthInvalidRequestException({
          errorDescription: `PKCE using ${CodeChallengeMethodValue.METHOD_S256().toString()} method is mandatory outside testing and development`,
        }),
    );
    Assert(
      Boolean(scope),
      () =>
        new OauthInvalidRequestException({
          errorDescription: `No scope in request`,
        }),
    );

    const request = await AuthorizationFacade.request(
      {
        clientId: IdentityValue.fromString(clientId),
        responseType: ResponseTypeValue.fromString(responseType),
        id: IdentityValue.create(),
        scope: scope
          ? ScopeValueImmutableSet.fromUnknown(scope)
          : ScopeValueImmutableSet.fromArray([]),
        state: state || "",
        codeChallenge: codeChallenge || "",
        codeChallengeMethod: codeChallengeMethod
          ? CodeChallengeMethodValue.fromUnknown(codeChallengeMethod)
          : CodeChallengeMethodValue.METHOD_NONE(),
        intent: intent ? IntentValue.fromString(intent) : null,
      },
      this.requests,
      this.clients,
    );

    return {
      requestId: request.id.toString(),
      intent: request.intent ? request.intent.toString() : undefined,
    };
  }

  async prepareAuthorizationPrompt({
    requestId,
    email,
  }: {
    requestId: string;
    intent?: string;
    email?: string;
  }) {
    const request = await NotFoundToDomainException(
      () => this.requests.retrieve(IdentityValue.fromString(requestId)),
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
    accessDeniedUrl.searchParams.set("state", request.state);
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
    redirect.searchParams.set("state", request.state);

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
    redirect.searchParams.set("state", request.state);

    return {
      redirectUriWithAccessDeniedErrorAndState: redirect.toString(),
    };
  }

  async grantAuthorizationCode({
    clientId,
    code,
    codeVerifier,
  }: {
    clientId: string;
    code: string | undefined;
    codeVerifier: string | undefined;
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
