import { IdentityValue } from "@domain/IdentityValue";
import { NumericDateValue } from "@domain/authentication/OAuth/User/NumericDateValue";
import { Assert } from "@domain/Assert";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { ScopeValue } from "@domain/authentication/OAuth/Token/Scope/ScopeValue";

export class RefreshTokenValue {
  public readonly jti: string;
  public readonly exp: number;
  public readonly clientId: string;

  private constructor({
    clientId,
    jti,
    exp,
  }: {
    jti: IdentityValue;
    exp: NumericDateValue;
    clientId: IdentityValue;
  }) {
    this.jti = jti.toString();
    this.exp = exp.toNumber();
    this.clientId = clientId.toString();
  }

  public static fromUnknown(value: unknown): RefreshTokenValue {
    Assert(
      !!value && typeof value === "object",
      "UserRefreshTokenValue must be an object",
    );
    Assert(
      "clientId" in value,
      "UserRefreshTokenValue have to have a clientId property",
    );
    Assert("jti" in value, "UserRefreshTokenValue have to have jti property");
    Assert("exp" in value, "UserRefreshTokenValue have to have a exp property");
    return new RefreshTokenValue({
      clientId: IdentityValue.fromUnknown(value.clientId),
      jti: IdentityValue.fromUnknown(value.jti),
      exp: NumericDateValue.fromUnknown(value.exp),
    });
  }

  public static fromTokenPayload(payload: TokenPayload): RefreshTokenValue {
    Assert(payload.hasScope(ScopeValue.TOKEN_REFRESH()), "Not a refresh token");
    return new RefreshTokenValue({
      clientId: IdentityValue.fromString(payload.aud),
      exp: NumericDateValue.fromNumber(payload.exp),
      jti: IdentityValue.fromString(payload.jti),
    });
  }
}
