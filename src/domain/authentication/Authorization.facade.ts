import { Assert } from "@domain/Assert";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE/PKCE.interface";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { OAuthAccessDeniedException } from "@domain/authentication/OAuth/Errors/OauthAccessDeniedException";
import { OauthInvalidClientException } from "@domain/authentication/OAuth/Errors/OauthInvalidClientException";
import { OauthInvalidCredentialsException } from "@domain/authentication/OAuth/Errors/OauthInvalidCredentialsException";
import { OauthRedirectUriMismatchException } from "@domain/authentication/OAuth/Errors/OauthRedirectUriMismatchException";
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
import { AuthConfig } from "@infrastructure/config/configs";

export class AuthorizationFacade {
  public static async request(
    params: {
      id: IdentityValue;
      responseType: ResponseTypeValue;
      clientId: IdentityValue;
      redirectUri: HttpUrlValue;
      scope: ScopeValueImmutableSet;
      state: string;
      codeChallenge: string;
      codeChallengeMethod: CodeChallengeMethodValue;
    },
    requests: RequestInterface,
    clients: ClientInterface,
  ): Promise<Request> {
    const request = await Request.create(params, clients);
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
    const request = await requests.retrieve(params.requestId);
    const user = await users.getByEmail(params.credentials.email);

    Assert(
      params.credentials.email.isEqual(user.email),
      () =>
        new OauthInvalidCredentialsException({
          message: "Email mismatch",
        }),
    );
    Assert(
      await params.credentials.password.isEqualHashedPassword(
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
      redirectUri,
    }: {
      clientId: IdentityValue;
      code: string;
      codeVerifier: string;
      redirectUri: HttpUrlValue;
    },
    requests: RequestInterface,
    PKCE: PKCEInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UsersInterface,
    tokenPayloads: TokenPayloadInterface,
    clients: ClientInterface,
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    const request = await requests.getByAuthorizationCode(code);

    Assert(
      request.clientId.isEqual(clientId),
      () =>
        new OauthInvalidClientException({
          message: "Invalid clientId",
        }),
    );

    Assert(
      request.redirectUri.isEqual(redirectUri),
      () =>
        new OauthRedirectUriMismatchException({
          message: "Mismatch between saved and provided redirectUri",
        }),
    );

    if (
      !request.codeChallengeMethod.isEqual(
        CodeChallengeMethodValue.METHOD_NONE(),
      )
    ) {
      Assert(
        PKCE.verify({
          codeChallenge: request.codeChallenge,
          codeVerifier,
          method: request.codeChallengeMethod,
        }),
        () =>
          new OAuthAccessDeniedException({
            message: "Failed PKCE code challenge",
          }),
      );
    }

    request.useAuthorizationCode(code, clock);

    Assert(request.authorizationCode instanceof Code);
    const user = await users.retrieve(
      IdentityValue.fromString(request.authorizationCode.sub),
    );
    const client = await clients.retrieve(clientId);

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
    const signedIdToken = await idTokenPayload.sign(tokenPayloads);

    /**
     * accessToken is intended to authenticate api calls.
     * It should not be inspected by client.
     */
    const accessTokenPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: request.scope
        .add(ScopeValue.TOKEN_AUTHENTICATE())
        .remove(ScopeValue.TOKEN_REFRESH()),
      clock,
      client,
    });
    const signedAccessToken = await accessTokenPayload.sign(tokenPayloads);

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
    const signedRefreshToken = await refreshTokenPayload.sign(tokenPayloads);

    await requests.persist(request);

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
