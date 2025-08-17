import { Assert } from "@domain/Assert";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE/PKCE.interface";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { OauthInvalidClientException } from "@domain/authentication/OAuth/Errors/OauthInvalidClientException";
import { OauthInvalidCredentialsException } from "@domain/authentication/OAuth/Errors/OauthInvalidCredentialsException";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { OauthInvalidScopeException } from "@domain/authentication/OAuth/Errors/OauthInvalidScopeException";
import { OauthInvalidTokenException } from "@domain/authentication/OAuth/Errors/OauthInvalidTokenException";
import { OauthRedirectUriMismatchException } from "@domain/authentication/OAuth/Errors/OauthRedirectUriMismatchException";
import { OauthServerErrorException } from "@domain/authentication/OAuth/Errors/OauthServerErrorException";
import { OauthTokenExpiredException } from "@domain/authentication/OAuth/Errors/OauthTokenExpiredException";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdTokenPayload } from "@domain/authentication/OAuth/Token/IdTokenPayload";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { PasswordInterface } from "@domain/authentication/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { UsersInterface } from "@domain/authentication/OAuth/User/Users.interface";
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

  public static async prompt(
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
      (error) =>
        new OauthInvalidCredentialsException({
          message: error.message,
        }),
    );

    Assert(
      params.credentials.email.isEqual(user.email),
      () =>
        new OauthInvalidCredentialsException({
          message: "Email mismatch",
        }),
    );

    Assert(
      await params.credentials.password.matchHashedPassword(
        user.password,
        passwords,
      ),
      () =>
        new OauthInvalidCredentialsException({
          message: "Password mismatch",
        }),
    );

    request.issueAuthorizationCode(user.identity, codes, clock, authConfig);

    await requests.persist(request);

    return request;
  }

  public static async codeExchange(
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
    tokenPayloads: TokenPayloadInterface,
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
          message: "Invalid clientId",
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
      (error) =>
        new OauthServerErrorException({
          message: error.message,
        }),
    );

    const tokens: Partial<TSignedTokens> = {};

    if (request.scope.hasScope(ScopeValue.PROFILE())) {
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
    const accessTokenScope = request.scope
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

    if (request.scope.hasScope(ScopeValue.TOKEN_REFRESH())) {
      /**
       * refreshToken is intended to obtain new access token before or after previous expired.
       * It cannot be used to authenticate api calls - only to obtain access token.
       * It should not be inspected by client.
       */
      const refreshTokenPayload = TokenPayload.createRefreshToken({
        authConfig,
        user,
        scope: request.scope
          .add(ScopeValue.TOKEN_REFRESH())
          .remove(ScopeValue.TOKEN_AUTHENTICATE()),
        clock,
        client,
      });
      tokens.refreshToken = await refreshTokenPayload.sign(tokenPayloads);
      user.rotateRefreshToken(refreshTokenPayload, clock);
    }

    await requests.persist(request);
    await users.persist(user);

    return {
      ...tokens,
      accessToken: tokens.accessToken,
      expiresIn: accessTokenPayload.exp - clock.nowAsSecondsSinceEpoch(),
      expiresAt: accessTokenPayload.exp,
      scope: accessTokenScope,
    } satisfies TSignedTokens;
  }

  public static async refresh(
    refreshToken: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UsersInterface,
    clients: ClientInterface,
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
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
        new OauthInvalidTokenException({ message: "jwt has invalid issuer" }),
    );

    Assert(
      user.hasRefreshToken(IdentityValue.fromString(payload.jti), clock),
      () =>
        new OauthInvalidTokenException({
          message: "refresh token is not found on user",
        }),
    );

    const idTokenPayload = IdTokenPayload.createIdToken({
      clock,
      authConfig,
      user,
      client,
    });
    const signedIdToken = await idTokenPayload.sign(tokenPayloads);

    const accessTokenPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_AUTHENTICATE())
        .remove(ScopeValue.TOKEN_REFRESH()),
      clock,
      client,
    });
    const signedAccessToken = await accessTokenPayload.sign(tokenPayloads);

    const refreshTokenPayload = TokenPayload.createRefreshToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_REFRESH())
        .remove(ScopeValue.TOKEN_AUTHENTICATE()),
      clock,
      client,
    });
    const signedRefreshToken = await refreshTokenPayload.sign(tokenPayloads);

    user.rotateRefreshToken(refreshTokenPayload, clock);
    await users.persist(user);

    return {
      idToken: signedIdToken,
      accessToken: signedAccessToken,
      expiration: accessTokenPayload.exp,
      refreshToken: signedRefreshToken,
    };
  }
}
