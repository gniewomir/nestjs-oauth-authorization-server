import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import { IdentityValue } from "@domain/IdentityValue";
import { Assert } from "@domain/Assert";

export type TCodeConstructorArgs = ConstructorParameters<typeof Code>;
export type TCodeConstructorParam = TCodeConstructorArgs[0];

export class Code {
  public readonly userId: IdentityValue;
  public readonly authorizationCode: string;
  public readonly expiration: number;
  public readonly issued: number;
  private _used: boolean;

  constructor(params: {
    userId: IdentityValue;
    authorizationCode: string;
    used: boolean;
    expiration: number;
    issued: number;
  }) {
    this.userId = params.userId;
    this.authorizationCode = params.authorizationCode;
    this.expiration = params.expiration;
    this.issued = params.issued;
    this._used = params.used;
  }

  public static create(
    userId: IdentityValue,
    authorizationCodeInterface: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new Code({
      userId,
      authorizationCode: authorizationCodeInterface.generateAuthorizationCode(),
      used: false,
      issued: now,
      expiration: now + authConfig.oauthAuthorizationCodeExpirationSeconds,
    });
  }

  public use(clock: ClockInterface): string {
    Assert(!this._used, "Authorization Code already used!");
    Assert(
      this.expiration > clock.nowAsSecondsSinceEpoch(),
      "Authorization code expired!",
    );
    this._used = true;
    return this.authorizationCode;
  }

  public toString(): string {
    return this.authorizationCode;
  }
}
