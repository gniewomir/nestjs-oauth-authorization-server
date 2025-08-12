import { AuthConfig } from "@infrastructure/config/configs";
import { TokenPayloadInterface } from "./OAuth/User/Token/TokenPayload.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { TokenPayload } from "@domain/authentication/OAuth/User/Token/TokenPayload";
import { ScopeValue } from "@domain/authentication/OAuth/User/Token/Scope/ScopeValue";
import { Assert } from "@domain/Assert";
import { IdTokenPayload } from "@domain/authentication/OAuth/User/Token/IdTokenPayload";
import { UserInterface } from "@domain/authentication/OAuth/User/User.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/User/Token/Scope/ScopeImmutableSet";

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
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    const payload = await tokenPayloads.verify(refreshToken);
    const user = await users.retrieve(IdentityValue.fromString(payload.sub));

    Assert(payload.hasNotExpired(clock), "jwt expired");

    Assert(
      ScopeImmutableSet.fromString(payload.scope).hasScope(
        ScopeValue.TOKEN_REFRESH(),
      ),
      "jwt does not contain required scope",
    );

    Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");

    const idTokenPayload = IdTokenPayload.createIdToken({
      clock,
      authConfig,
      user,
    });

    const accessTokenPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: ScopeImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_AUTHENTICATE())
        .remove(ScopeValue.TOKEN_REFRESH()),
      clock,
    });

    const refreshTokenPayload = TokenPayload.createRefreshToken({
      authConfig,
      user,
      scope: ScopeImmutableSet.fromString(payload.scope)
        .add(ScopeValue.TOKEN_REFRESH())
        .remove(ScopeValue.TOKEN_AUTHENTICATE()),
      clock,
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
