import { Assert } from "@domain/Assert";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { OauthInvalidScopeException } from "@domain/authentication/OAuth/Errors/OauthInvalidScopeException";
import { OauthInvalidTokenException } from "@domain/authentication/OAuth/Errors/OauthInvalidTokenException";
import { OauthServerErrorException } from "@domain/authentication/OAuth/Errors/OauthServerErrorException";
import { OauthTokenExpiredException } from "@domain/authentication/OAuth/Errors/OauthTokenExpiredException";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdTokenPayload } from "@domain/authentication/OAuth/Token/IdTokenPayload";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { UsersInterface } from "@domain/authentication/OAuth/User/Users.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";
import { AuthConfig } from "@infrastructure/config/configs";

export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    const payload = await tokenPayloads.verify(token);
    Assert(
      payload.hasValidIssuer(authConfig),
      () =>
        new OauthInvalidTokenException({ message: "jwt has invalid issuer" }),
    );
    Assert(
      payload.hasNotExpired(clock),
      () => new OauthTokenExpiredException({ message: "jwt expired" }),
    );
    Assert(
      payload.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      () =>
        new OauthInvalidScopeException({
          message: "jwt does not contain required scope",
        }),
    );
    return payload;
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

  public static logoutClient() {
    throw new Error("Not implemented");
  }
}
