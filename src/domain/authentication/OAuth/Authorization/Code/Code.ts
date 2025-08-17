import { Assert } from "@domain/Assert";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { OauthInvalidCredentialsException } from "@domain/authentication/OAuth/Errors/OauthInvalidCredentialsException";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { OauthServerErrorException } from "@domain/authentication/OAuth/Errors/OauthServerErrorException";
import { NumericDateValue } from "@domain/authentication/OAuth/NumericDateValue";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export class Code {
  public readonly sub: string;
  public readonly code: string;
  public readonly exp: number;
  public readonly iat: number;
  private used: boolean;

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
          developerMessage:
            "Authorization code cannot expire before it was issued",
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
          developerMessage: "Code have to be an object",
        }),
    );
    Assert(
      "code" in value && typeof value.code === "string",
      () =>
        new OauthInvalidRequestException({
          developerMessage: "Code must be a string",
        }),
    );
    Assert(
      "iat" in value,
      () =>
        new OauthInvalidRequestException({
          developerMessage: "iat is missing",
        }),
    );
    Assert(
      "exp" in value,
      () =>
        new OauthInvalidRequestException({
          developerMessage: "exp is missing",
        }),
    );
    Assert(
      "used" in value && typeof value.used === "boolean",
      () =>
        new OauthInvalidRequestException({
          developerMessage: "Used value must be a boolean",
        }),
    );
    Assert(
      "sub" in value,
      () =>
        new OauthInvalidRequestException({
          developerMessage: "sub is missing",
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

  public use(clock: ClockInterface): string {
    Assert(
      !this.used,
      () =>
        new OauthInvalidCredentialsException({
          developerMessage: "Authorization Code already used!",
        }),
    );
    Assert(
      this.exp > clock.nowAsSecondsSinceEpoch(),
      () =>
        new OauthInvalidCredentialsException({
          developerMessage: "Authorization code expired!",
        }),
    );
    this.used = true;
    return this.code;
  }

  public toString(): string {
    return this.code;
  }
}
