import { Assert } from "@domain/Assert";
import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import {
  OauthInvalidRequestException,
  OauthServerErrorException,
} from "@domain/auth/OAuth/Errors";
import { NumericDateValue } from "@domain/auth/OAuth/NumericDateValue";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export class Code {
  public readonly sub: string;
  public readonly code: string;
  public readonly exp: number;
  public readonly iat: number;
  public used: boolean;

  private constructor(params: {
    sub: IdentityValue;
    code: string;
    used: boolean;
    exp: NumericDateValue;
    iat: NumericDateValue;
  }) {
    Assert(
      params.iat.toNumber() < params.exp.toNumber(),
      () =>
        new OauthServerErrorException({
          message: "Authorization code cannot expire before it was issued",
        }),
    );
    this.sub = params.sub.toString();
    this.code = params.code;
    this.exp = params.exp.toNumber();
    this.iat = params.iat.toNumber();
    this.used = params.used;
  }

  public static create(
    userId: IdentityValue,
    authorizationCodeInterface: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new Code({
      sub: userId,
      code: authorizationCodeInterface.generateAuthorizationCode(),
      used: false,
      iat: NumericDateValue.fromNumber(now),
      exp: NumericDateValue.fromNumber(
        now + authConfig.oauthAuthorizationCodeExpirationSeconds,
      ),
    });
  }

  public static fromUnknown(value: unknown): Code {
    Assert(
      !!value && typeof value === "object",
      () =>
        new OauthInvalidRequestException({
          message: "Code have to be an object",
        }),
    );
    Assert(
      "code" in value && typeof value.code === "string",
      () =>
        new OauthInvalidRequestException({
          message: "Code must be a string",
        }),
    );
    Assert(
      "iat" in value,
      () =>
        new OauthInvalidRequestException({
          message: "iat is missing",
        }),
    );
    Assert(
      "exp" in value,
      () =>
        new OauthInvalidRequestException({
          message: "exp is missing",
        }),
    );
    Assert(
      "used" in value && typeof value.used === "boolean",
      () =>
        new OauthInvalidRequestException({
          message: "Used value must be a boolean",
        }),
    );
    Assert(
      "sub" in value,
      () =>
        new OauthInvalidRequestException({
          message: "sub is missing",
        }),
    );
    return new Code({
      sub: IdentityValue.fromUnknown(value.sub),
      code: value.code,
      iat: NumericDateValue.fromUnknown(value.iat),
      exp: NumericDateValue.fromUnknown(value.exp),
      used: value.used,
    });
  }

  public markAsUsed() {
    this.used = true;
  }

  public toString(): string {
    return this.code;
  }
}
