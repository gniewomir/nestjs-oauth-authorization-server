import { IdentityValue } from "@domain/IdentityValue";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/User/Token/TokenPayload.interface";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeImmutableSet";
import { ClockInterface } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { Assert } from "@domain/Assert";

export type TTokenPayloadConstructorArgs = ConstructorParameters<
  typeof TokenPayload
>;
export type TTokenPayloadParam = TTokenPayloadConstructorArgs[0];

export class TokenPayload {
  public readonly jti: string;
  public readonly iss: string;
  public readonly sub: string;
  public readonly exp: number;
  public readonly iat: number;
  public readonly scope: string;

  constructor(payload: {
    jti: IdentityValue;
    iss: string;
    sub: IdentityValue;
    exp: number;
    iat: number;
    scope: ScopeImmutableSet;
  }) {
    this.iss = payload.iss;
    this.iat = payload.iat;
    this.exp = payload.exp;
    this.sub = payload.sub.toString();
    this.jti = payload.jti.toString();
    this.scope = payload.scope.toString();
  }

  public static fromUnknown(payload: Record<string, unknown>) {
    Assert(typeof payload.jti === "string", "Claim jti must be a string");
    Assert(typeof payload.sub === "string", "Claim sub must be a string");
    Assert(typeof payload.iss === "string", "Claim iss must be a string");
    Assert(
      typeof payload.iat === "number" && payload.iat > 0,
      "Claim iat must be a timestamp",
    );
    Assert(
      typeof payload.exp === "number" && payload.exp > 0,
      "Claim exp must be a timestamp",
    );
    Assert(
      payload.exp > payload.iat,
      "JWT expiration cannot be before issuing",
    );
    Assert(typeof payload.scope === "string", "Scope must be a string");

    return new TokenPayload({
      iss: payload.iss,
      exp: payload.exp,
      iat: payload.iat,
      jti: IdentityValue.fromString(payload.jti),
      sub: IdentityValue.fromString(payload.sub),
      scope: ScopeImmutableSet.fromString(payload.scope),
    });
  }

  public hasScope(scope: ScopeValue | string): boolean {
    return ScopeImmutableSet.fromString(this.scope).hasScope(scope);
  }

  public async sign(tokenInterface: TokenPayloadInterface): Promise<string> {
    return await tokenInterface.sign(Object.fromEntries(Object.entries(this)));
  }

  public hasNotExpired(clock: ClockInterface): boolean {
    return this.exp > clock.nowAsSecondsSinceEpoch();
  }

  public hasValidIssuer(authConfig: AuthConfig): boolean {
    return this.iss === authConfig.jwtIssuer;
  }
}
