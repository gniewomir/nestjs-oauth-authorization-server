import { AuthConfig } from "@infrastructure/config/configs";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { ScopeValue } from "@domain/authentication/OAuth/Token/Scope/ScopeValue";
import { Assert } from "@domain/Assert";
import { IdTokenPayload } from "@domain/authentication/OAuth/Token/IdTokenPayload";
import { UserInterface } from "@domain/authentication/OAuth/User/User.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Token/Scope/ScopeValueImmutableSet";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";

export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    const payload = await tokenPayloads.verify(token);
    Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");
    Assert(payload.hasNotExpired(clock), "jwt expired");
    Assert(
      payload.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      "jwt does not contain required scope",
    );
    return payload;
  }

  public static async refresh(
    refreshToken: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UserInterface,
    clients: ClientInterface,
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    const payload = await tokenPayloads.verify(refreshToken);
    const user = await users.retrieve(IdentityValue.fromString(payload.sub));
    const client = await clients.retrieve(
      IdentityValue.fromString(payload.aud),
    );

    Assert(payload.hasNotExpired(clock), "jwt expired");

    Assert(
      ScopeValueImmutableSet.fromString(payload.scope).hasScope(
        ScopeValue.TOKEN_REFRESH(),
      ),
      "jwt does not contain required scope",
    );

    Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");

    Assert(
      user.hasRefreshToken(IdentityValue.fromString(payload.jti), clock),
      "unknown refresh token",
    );

    const idTokenPayload = IdTokenPayload.createIdToken({
      clock,
      authConfig,
      user,
      client,
    });

    const accessTokenPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_AUTHENTICATE())
        .remove(ScopeValue.TOKEN_REFRESH()),
      clock,
      client,
    });

    const refreshTokenPayload = TokenPayload.createRefreshToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_REFRESH())
        .remove(ScopeValue.TOKEN_AUTHENTICATE()),
      clock,
      client,
    });

    return {
      idToken: await idTokenPayload.sign(tokenPayloads),
      accessToken: await accessTokenPayload.sign(tokenPayloads),
      expiration: accessTokenPayload.exp,
      refreshToken: await refreshTokenPayload.sign(tokenPayloads),
    };
  }

  public static logoutClient() {
    throw new Error("Not implemented");
  }
}
