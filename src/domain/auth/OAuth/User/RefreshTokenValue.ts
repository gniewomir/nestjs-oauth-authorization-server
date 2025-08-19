import { Assert } from "@domain/Assert";
import {
  OauthInvalidRequestException,
  OauthInvalidScopeException,
} from "@domain/auth/OAuth/Errors";
import { NumericDateValue } from "@domain/auth/OAuth/NumericDateValue";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
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
      () =>
        new OauthInvalidRequestException({
          message: "UserRefreshTokenValue must be an object",
        }),
    );
    Assert(
      "aud" in value,
      () =>
        new OauthInvalidRequestException({
          message: "UserRefreshTokenValue have to have a aud property",
        }),
    );
    Assert(
      "jti" in value,
      () =>
        new OauthInvalidRequestException({
          message: "UserRefreshTokenValue have to have jti property",
        }),
    );
    Assert(
      "exp" in value,
      () =>
        new OauthInvalidRequestException({
          message: "UserRefreshTokenValue have to have a exp property",
        }),
    );
    return new RefreshTokenValue({
      aud: IdentityValue.fromUnknown(value.aud),
      jti: IdentityValue.fromUnknown(value.jti),
      exp: NumericDateValue.fromUnknown(value.exp),
    });
  }

  public static fromTokenPayload(payload: TokenPayload): RefreshTokenValue {
    Assert(
      payload.hasScope(ScopeValue.TOKEN_REFRESH()),
      () =>
        new OauthInvalidScopeException({
          message: "Not a refresh token",
        }),
    );
    return new RefreshTokenValue({
      aud: IdentityValue.fromString(payload.aud),
      exp: NumericDateValue.fromNumber(payload.exp),
      jti: IdentityValue.fromString(payload.jti),
    });
  }
}
