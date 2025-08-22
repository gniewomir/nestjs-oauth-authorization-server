import { Assert } from "@domain/Assert";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { IntentValue } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEInterface } from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import { Request } from "@domain/auth/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/auth/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { Client } from "@domain/auth/OAuth/Client/Client";
import { ClientInterface } from "@domain/auth/OAuth/Client/Client.interface";
import {
  OauthInvalidClientException,
  OauthInvalidCredentialsException,
  OauthInvalidRequestException,
  OauthInvalidScopeException,
  OauthInvalidTokenException,
  OauthRedirectUriMismatchException,
  OauthServerErrorException,
  OauthTokenExpiredException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { IdTokenPayload } from "@domain/auth/OAuth/Token/IdTokenPayload";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/auth/OAuth/Token/TokenPayloads.interface";
import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { PasswordInterface } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/auth/OAuth/User/Credentials/PasswordValue";
import { UserEmailNotFoundException } from "@domain/auth/OAuth/User/Errors/UserEmailNotFoundException";
import { UserPasswordMismatchException } from "@domain/auth/OAuth/User/Errors/UserPasswordMismatchException";
import { UniqueEmailSpecification } from "@domain/auth/OAuth/User/UniqueEmail.specification";
import { User } from "@domain/auth/OAuth/User/User";
import { UsersInterface } from "@domain/auth/OAuth/User/Users.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";
import { AuthConfig } from "@infrastructure/config/configs";

type TSignedTokens = {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
  refreshToken?: string;
  idToken?: string;
  scope: ScopeValueImmutableSet;
};

export class AuthorizationFacade {
  public static async request(
    params: {
      id: IdentityValue;
      responseType: ResponseTypeValue;
      clientId: IdentityValue;
      scope: ScopeValueImmutableSet;
      state: string;
      codeChallenge: string;
      codeChallengeMethod: CodeChallengeMethodValue;
      intent: IntentValue | null;
    },
    requests: RequestInterface,
    clients: ClientInterface,
  ): Promise<Request> {
    const client = await NotFoundToDomainException(
      () => clients.retrieve(params.clientId),
      (error) =>
        new OauthInvalidCredentialsException({
          message: error.message,
        }),
    );

    const redirectUri = client.redirectUri;

    Assert(
      client.scope.isSupersetOf(params.scope),
      () =>
        new OauthInvalidScopeException({
          message: "Requested scope unavailable for provided client",
        }),
    );
    const request = await Request.create(
      {
        ...params,
        redirectUri,
      },
      clients,
    );
    await requests.persist(request);
    return request;
  }

  public static async authorizePrompt(
    params: {
      requestId: IdentityValue;
      credentials: {
        email: EmailValue;
        password: PasswordValue;
        rememberMe: boolean;
      };
    },
    requests: RequestInterface,
    users: UsersInterface,
    passwords: PasswordInterface,
    codes: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<Request> {
    const request = await NotFoundToDomainException(
      () => requests.retrieve(params.requestId),
      (error) =>
        new OauthInvalidRequestException({
          message: error.message,
        }),
    );
    const user = await NotFoundToDomainException(
      () => users.getByEmail(params.credentials.email),
      () =>
        new UserEmailNotFoundException({
          errorCode: "unknown-email",
          message: "User not found",
        }),
    );

    Assert(
      params.credentials.email.isEqual(user.email),
      () =>
        new UserEmailNotFoundException({
          errorCode: "unknown-email",
          message: "User not found",
        }),
    );

    const passwordsMatch =
      await params.credentials.password.matchHashedPassword(
        user.password,
        passwords,
      );
    Assert(
      passwordsMatch,
      () =>
        new UserPasswordMismatchException({
          errorCode: "unknown-password",
          message: "Password mismatch",
        }),
    );

    request.issueAuthorizationCode(user.identity, codes, clock, authConfig);

    await requests.persist(request);

    return request;
  }

  public static async authorizationCodeGrant(
    {
      clientId,
      code,
      codeVerifier,
    }: {
      clientId: IdentityValue;
      code: string;
      codeVerifier: string;
    },
    requests: RequestInterface,
    PKCE: PKCEInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UsersInterface,
    tokenPayloads: TokenPayloadsInterface,
    clients: ClientInterface,
  ): Promise<TSignedTokens> {
    const request = await NotFoundToDomainException(
      () => requests.getByAuthorizationCode(code),
      () =>
        new OauthInvalidCredentialsException({
          message:
            "There is no authorization request with matching authorization code",
        }),
    );
    const client = await NotFoundToDomainException(
      () => clients.retrieve(request.clientId),
      (error) =>
        new OauthServerErrorException({
          message: error.message,
        }),
    );

    Assert(
      request.clientId.isEqual(clientId),
      () =>
        new OauthInvalidClientException({
          message: "Provided clientId does not match authorization request",
        }),
    );

    Assert(
      request.redirectUri.isEqual(client.redirectUri),
      () =>
        new OauthRedirectUriMismatchException({
          message: "Mismatch between saved and provided redirectUri",
        }),
    );

    Assert(
      PKCE.verify({
        codeChallenge: request.codeChallenge,
        codeVerifier,
        method: request.codeChallengeMethod,
      }),
      () =>
        new OauthInvalidCredentialsException({
          message: "Failed PKCE code challenge",
        }),
    );

    request.useAuthorizationCode(code, clock);

    const user = await NotFoundToDomainException(
      () => {
        Assert(request.authorizationCode instanceof Code);
        return users.retrieve(
          IdentityValue.fromString(request.authorizationCode.sub),
        );
      },
      () =>
        new OauthServerErrorException({
          message:
            "Could not find user associated with this authorization code",
        }),
    );

    const tokens = AuthorizationFacade.issueTokens(
      {
        scope: request.scope,
        client,
        user,
      },
      clock,
      authConfig,
      tokenPayloads,
    );

    // we have to persist spending of authorization code
    await requests.persist(request);
    // we have to persist rotation of refresh token
    await users.persist(user);

    return tokens;
  }

  public static async refreshTokenGrant(
    refreshToken: string,
    tokenPayloads: TokenPayloadsInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UsersInterface,
    clients: ClientInterface,
  ): Promise<TSignedTokens> {
    const payload = await tokenPayloads.verify(refreshToken);
    const user = await NotFoundToDomainException(
      () => users.retrieve(IdentityValue.fromString(payload.sub)),
      () =>
        new OauthServerErrorException({
          message: "subject of valid token does not exist in the system!",
        }),
    );
    const client = await NotFoundToDomainException(
      () => clients.retrieve(IdentityValue.fromString(payload.aud)),
      () =>
        new OauthServerErrorException({
          message:
            "audience of valid token (client) does not exist in the system!",
        }),
    );

    Assert(
      payload.hasNotExpired(clock),
      () => new OauthTokenExpiredException({ message: "jwt expired" }),
    );

    Assert(
      ScopeValueImmutableSet.fromString(payload.scope).hasScope(
        ScopeValue.TOKEN_REFRESH(),
      ),
      () =>
        new OauthInvalidScopeException({
          message: "jwt does not contain required scope",
        }),
    );

    Assert(
      payload.hasValidIssuer(authConfig),
      () =>
        new OauthInvalidTokenException({
          message: "jwt has invalid issuer",
        }),
    );

    Assert(
      user.hasRefreshToken(IdentityValue.fromString(payload.jti), clock),
      () =>
        new OauthInvalidTokenException({
          message: "refresh token is not found on user",
        }),
    );

    const tokens = AuthorizationFacade.issueTokens(
      {
        scope: ScopeValueImmutableSet.fromString(payload.scope),
        client,
        user,
      },
      clock,
      authConfig,
      tokenPayloads,
    );

    // we have to persist rotation of refresh token
    await users.persist(user);

    return tokens;
  }

  public static async issueTokens(
    {
      scope,
      client,
      user,
    }: { scope: ScopeValueImmutableSet; client: Client; user: User },
    clock: ClockInterface,
    authConfig: AuthConfig,
    tokenPayloads: TokenPayloadsInterface,
  ): Promise<TSignedTokens> {
    const tokens: Partial<TSignedTokens> = {};

    if (scope.hasScope(ScopeValue.PROFILE())) {
      /**
       * idToken is intended as proof of authentication.
       * It can contain information's about authenticated user.
       * It cannot be used to authenticate api requests therefore it cannot contain scope.
       * It can be inspected by the client.
       */
      const idTokenPayload = IdTokenPayload.createIdToken({
        clock,
        authConfig,
        user,
        client,
      });
      tokens.idToken = await idTokenPayload.sign(tokenPayloads);
    }

    /**
     * accessToken is intended to authenticate api calls.
     * It should not be inspected by client.
     */
    const accessTokenScope = scope
      .add(ScopeValue.TOKEN_AUTHENTICATE())
      .remove(ScopeValue.TOKEN_REFRESH());
    const accessTokenPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: accessTokenScope,
      clock,
      client,
    });
    tokens.accessToken = await accessTokenPayload.sign(tokenPayloads);

    if (scope.hasScope(ScopeValue.TOKEN_REFRESH())) {
      /**
       * refreshToken is intended to obtain new access token before or after previous expired.
       * It cannot be used to authenticate api calls - only to obtain access token.
       * It should not be inspected by client.
       */
      const refreshTokenPayload = TokenPayload.createRefreshToken({
        authConfig,
        user,
        scope: scope
          .add(ScopeValue.TOKEN_REFRESH())
          .remove(ScopeValue.TOKEN_AUTHENTICATE()),
        clock,
        client,
      });
      tokens.refreshToken = await refreshTokenPayload.sign(tokenPayloads);
      user.rotateRefreshToken(refreshTokenPayload, clock);
    }

    return {
      ...tokens,
      accessToken: tokens.accessToken,
      expiresIn: accessTokenPayload.exp - clock.nowAsSecondsSinceEpoch(),
      expiresAt: accessTokenPayload.exp,
      scope,
    } satisfies TSignedTokens;
  }

  public static async registerPrompt(
    params: {
      email: EmailValue;
      password: PasswordValue;
    },
    users: UsersInterface,
    passwords: PasswordInterface,
  ): Promise<{
    user: User;
    identity: IdentityValue;
  }> {
    const uniqueEmailSpecification = new UniqueEmailSpecification(users);

    Assert(
      await uniqueEmailSpecification.isSatisfied(params.email),
      "User email must be unique",
    );

    const hashedPassword = await params.password.toPasswordHash(passwords);
    const identity = IdentityValue.create();

    const user = await User.create(
      {
        identity,
        email: params.email,
        emailVerified: false,
        password: hashedPassword,
        refreshTokens: [],
      },
      uniqueEmailSpecification,
    );

    await users.persist(user);

    return {
      user,
      identity,
    };
  }
}
