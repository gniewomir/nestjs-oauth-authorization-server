import { Assert } from "@domain/Assert";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { NumericDateValue } from "@domain/authentication/OAuth/NumericDateValue";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { TokenPayloadsInterface } from "@domain/authentication/OAuth/Token/TokenPayloads.interface";
import { User } from "@domain/authentication/OAuth/User/User";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export type TTokenPayloadConstructorArgs = ConstructorParameters<
  typeof TokenPayload
>;
export type TTokenPayloadParam = TTokenPayloadConstructorArgs[0];

export class TokenPayload {
  /**
   * aud jwt claim - in our case oauth client id
   */
  public readonly aud: string;
  /**
   * jti jwt claim - jwt id
   */
  public readonly jti: string;
  /**
   * iss jwt claim - arbitrary string identifying issuer
   */
  public readonly iss: string;
  /**
   * sub jwt claim - user id
   */
  public readonly sub: string;
  public readonly exp: number;
  public readonly iat: number;
  public readonly scope: string;

  constructor(payload: {
    aud: IdentityValue;
    jti: IdentityValue;
    iss: string;
    sub: IdentityValue;
    exp: NumericDateValue;
    iat: NumericDateValue;
    scope: ScopeValueImmutableSet;
  }) {
    this.aud = payload.aud.toString();
    this.iss = payload.iss;
    this.iat = payload.iat.toNumber();
    this.exp = payload.exp.toNumber();
    this.sub = payload.sub.toString();
    this.jti = payload.jti.toString();
    this.scope = payload.scope.toString();
  }

  public static createAccessToken({
    authConfig,
    scope,
    user,
    clock,
    client,
  }: {
    authConfig: AuthConfig;
    user: User;
    scope: ScopeValueImmutableSet;
    clock: ClockInterface;
    client: Client;
  }) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new TokenPayload({
      aud: client.id,
      jti: IdentityValue.create(),
      iss: authConfig.jwtIssuer,
      sub: user.identity,
      iat: NumericDateValue.fromNumber(now),
      exp: NumericDateValue.fromNumber(
        now + authConfig.jwtAccessTokenExpirationSeconds,
      ),
      scope,
    });
  }

  public static createRefreshToken({
    authConfig,
    scope,
    user,
    clock,
    client,
  }: {
    authConfig: AuthConfig;
    user: User;
    scope: ScopeValueImmutableSet;
    clock: ClockInterface;
    client: Client;
  }) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new TokenPayload({
      aud: client.id,
      jti: IdentityValue.create(),
      iss: authConfig.jwtIssuer,
      sub: user.identity,
      iat: NumericDateValue.fromNumber(now),
      exp: NumericDateValue.fromNumber(
        now +
          (scope.hasScope(ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL())
            ? authConfig.jwtLongTTLRefreshTokenExpirationSeconds
            : authConfig.jwtRefreshTokenExpirationSeconds),
      ),
      scope,
    });
  }

  public static fromUnknown(payload: Record<string, unknown>) {
    Assert(
      typeof payload.iss === "string",
      () =>
        new OauthInvalidRequestException({
          message: "Claim iss must be a string",
        }),
    );
    const exp = NumericDateValue.fromUnknown(payload.exp);
    const iat = NumericDateValue.fromUnknown(payload.iat);
    Assert(
      exp.toNumber() > iat.toNumber(),
      () =>
        new OauthInvalidRequestException({
          message: "jwt cannot expire before it was issued",
        }),
    );

    return new TokenPayload({
      aud: IdentityValue.fromUnknown(payload.aud),
      iss: payload.iss,
      exp,
      iat,
      jti: IdentityValue.fromUnknown(payload.jti),
      sub: IdentityValue.fromUnknown(payload.sub),
      scope: ScopeValueImmutableSet.fromUnknown(payload.scope ?? ""),
    });
  }

  public hasScope(scope: ScopeValue | string): boolean {
    return ScopeValueImmutableSet.fromString(this.scope).hasScope(scope);
  }

  public async sign(tokenInterface: TokenPayloadsInterface): Promise<string> {
    return await tokenInterface.sign(Object.fromEntries(Object.entries(this)));
  }

  public hasNotExpired(clock: ClockInterface): boolean {
    return this.exp > clock.nowAsSecondsSinceEpoch();
  }

  public hasValidIssuer(authConfig: AuthConfig): boolean {
    return this.iss === authConfig.jwtIssuer;
  }
}
