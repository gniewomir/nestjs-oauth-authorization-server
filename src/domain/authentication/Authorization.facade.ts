import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { IdentityValue } from "@domain/IdentityValue";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";
import { RequestInterface } from "@domain/authentication/OAuth/Authorization/Request.interface";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { UserInterface } from "@domain/authentication/OAuth/User/User.interface";
import { PasswordInterface } from "@domain/authentication/OAuth/User/Credentials/Password.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE.interface";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { IdTokenPayload } from "@domain/authentication/OAuth/Token/IdTokenPayload";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Token/Scope/ScopeValueImmutableSet";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { Assert } from "@domain/Assert";
import { ScopeValue } from "@domain/authentication/OAuth/Token/Scope/ScopeValue";

export class AuthorizationFacade {
  public static async request(
    params: {
      id: IdentityValue;
      clientId: IdentityValue;
      redirectUri: HttpUrlValue;
      scope: ScopeValueImmutableSet;
      state: string;
      codeChallenge: string;
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
    users: UserInterface,
    passwords: PasswordInterface,
    codes: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<{ authorizationCode: Code }> {
    const request = await requests.retrieve(params.requestId);
    const user = await users.getByEmail(params.credentials.email);

    Assert(params.credentials.email.isEqual(user.email), "Email mismatch");
    Assert(
      await params.credentials.password.isEqualHashedPassword(
        user.hashedPassword,
        passwords,
      ),
      "Password mismatch",
    );

    request.issueAuthorizationCode(user.identity, codes, clock, authConfig);

    await requests.persist(request);

    Assert(request.authorizationCode instanceof Code);

    return {
      authorizationCode: request.authorizationCode,
    };
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
    users: UserInterface,
    tokenPayloads: TokenPayloadInterface,
    clients: ClientInterface,
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    const request = await requests.getByAuthorizationCode(code);

    Assert(request.clientId.isEqual(clientId), "Invalid clientId");

    Assert(
      request.redirectUri.isEqual(redirectUri),
      "Mismatch between saved and provided redirectUri",
    );

    Assert(
      PKCE.verify({ codeChallenge: request.codeChallenge, codeVerifier }),
      "Failed PKCE code challenge",
    );

    Assert(
      request.useAuthorizationCode(code, clock),
      "Authorization code validation failed",
    );

    Assert(request.authorizationCode instanceof Code);
    const user = await users.retrieve(request.authorizationCode.userId);
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

    await requests.persist(request);

    user.rotateRefreshToken(refreshTokenPayload, clock);
    await users.persist(user);

    return {
      idToken: await idTokenPayload.sign(tokenPayloads),
      accessToken: await accessTokenPayload.sign(tokenPayloads),
      expiration: accessTokenPayload.exp,
      refreshToken: await refreshTokenPayload.sign(tokenPayloads),
    };
  }
}
