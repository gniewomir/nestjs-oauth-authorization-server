import { IdentityValue } from "@domain/IdentityValue";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/User/Token/TokenPayload.interface";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeImmutableSet";
import { ClockInterface } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { Assert } from "@domain/Assert";
import { NumericDateValue } from "@domain/authentication/OAuth/User/Token/NumericDateValue";

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
    exp: NumericDateValue;
    iat: NumericDateValue;
    scope: ScopeImmutableSet;
  }) {
    this.iss = payload.iss;
    this.iat = payload.iat.toNumber();
    this.exp = payload.exp.toNumber();
    this.sub = payload.sub.toString();
    this.jti = payload.jti.toString();
    this.scope = payload.scope.toString();
  }

  public static fromUnknown(payload: Record<string, unknown>) {
    Assert(typeof payload.iss === "string", "Claim iss must be a string");
    const exp = NumericDateValue.fromUnknown(payload.exp);
    const iat = NumericDateValue.fromUnknown(payload.iat);
    Assert(
      exp.toNumber() > iat.toNumber(),
      "jwt cannot expire before it was issued",
    );

    return new TokenPayload({
      iss: payload.iss,
      exp,
      iat,
      jti: IdentityValue.fromUnknown(payload.jti),
      sub: IdentityValue.fromUnknown(payload.sub),
      scope: ScopeImmutableSet.fromUnknown(payload.scope ?? ""),
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
