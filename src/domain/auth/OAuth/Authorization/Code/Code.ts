import { Assert } from "@domain/Assert";
import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { OauthServerErrorException } from "@domain/auth/OAuth/Errors";
import { NumericDateValue } from "@domain/auth/OAuth/NumericDateValue";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export type TCodeConstructorArgs = ConstructorParameters<typeof Code>;
export type TCodeConstructorParam = TCodeConstructorArgs[0];

export class Code {
  public readonly subject: IdentityValue;
  public readonly code: string;
  public readonly expires: NumericDateValue;
  public readonly issued: NumericDateValue;
  public _exchange: NumericDateValue | null;

  public set exchange(when: NumericDateValue) {
    this._exchange = when;
  }

  public get exchange(): NumericDateValue | null {
    return this._exchange;
  }

  constructor(params: {
    subject: IdentityValue;
    code: string;
    exchange: NumericDateValue | null;
    expires: NumericDateValue;
    issued: NumericDateValue;
  }) {
    Assert(
      params.issued.toNumber() < params.expires.toNumber(),
      () =>
        new OauthServerErrorException({
          message: "Authorization code cannot expire before it was issued",
        }),
    );
    this.subject = params.subject;
    this.code = params.code;
    this.expires = params.expires;
    this.issued = params.issued;
    this._exchange = params.exchange ? params.exchange : null;
  }

  public static create(
    userId: IdentityValue,
    authorizationCodeInterface: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new Code({
      subject: userId,
      code: authorizationCodeInterface.generateAuthorizationCode(),
      exchange: null,
      issued: NumericDateValue.fromNumber(now),
      expires: NumericDateValue.fromNumber(
        now + authConfig.oauthAuthorizationCodeExpirationSeconds,
      ),
    });
  }

  public static fromDatabase({
    subject,
    expires,
    issued,
    exchange,
    code,
  }: Record<keyof TCodeConstructorParam, unknown>) {
    Assert(typeof subject === "string");
    Assert(typeof expires === "number");
    Assert(typeof issued === "number");
    Assert(typeof exchange === "number" || exchange === null);
    Assert(typeof code === "string" && code.length > 0);
    return new Code({
      subject: IdentityValue.fromString(subject),
      code: code,
      exchange:
        exchange === null ? null : NumericDateValue.fromNumber(exchange),
      expires: NumericDateValue.fromNumber(expires),
      issued: NumericDateValue.fromNumber(issued),
    });
  }

  public toString(): string {
    return this.code;
  }
}
