import { Assert } from "@domain/Assert";
import { NumericDateValue } from "@domain/authentication/OAuth/NumericDateValue";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { IdentityValue } from "@domain/IdentityValue";

export class RefreshTokenValue {
  public readonly jti: string;
  public readonly exp: number;
  public readonly aud: string;

  private constructor({
    aud,
    jti,
    exp,
  }: {
    jti: IdentityValue;
    exp: NumericDateValue;
    aud: IdentityValue;
  }) {
    this.jti = jti.toString();
    this.exp = exp.toNumber();
    this.aud = aud.toString();
  }

  public static fromUnknown(value: unknown): RefreshTokenValue {
    Assert(
      !!value && typeof value === "object",
      "UserRefreshTokenValue must be an object",
    );
    Assert("aud" in value, "UserRefreshTokenValue have to have a aud property");
    Assert("jti" in value, "UserRefreshTokenValue have to have jti property");
    Assert("exp" in value, "UserRefreshTokenValue have to have a exp property");
    return new RefreshTokenValue({
      aud: IdentityValue.fromUnknown(value.aud),
      jti: IdentityValue.fromUnknown(value.jti),
      exp: NumericDateValue.fromUnknown(value.exp),
    });
  }

  public static fromTokenPayload(payload: TokenPayload): RefreshTokenValue {
    Assert(payload.hasScope(ScopeValue.TOKEN_REFRESH()), "Not a refresh token");
    return new RefreshTokenValue({
      aud: IdentityValue.fromString(payload.aud),
      exp: NumericDateValue.fromNumber(payload.exp),
      jti: IdentityValue.fromString(payload.jti),
    });
  }
}
