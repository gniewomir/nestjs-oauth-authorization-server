import { IdentityValue } from "@domain/IdentityValue";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { RefreshTokenValue } from "@domain/authentication/OAuth/User/RefreshTokenValue";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { ClockInterface } from "@domain/Clock.interface";

export type TUserConstructorArgs = ConstructorParameters<typeof User>;
export type TUserConstructorParam = TUserConstructorArgs[0];

export class User {
  public readonly identity: IdentityValue;
  public readonly email: EmailValue;
  public readonly emailVerified: boolean;
  public readonly hashedPassword: string;
  private _refreshTokens: RefreshTokenValue[];

  constructor(parameters: {
    identity: IdentityValue;
    email: EmailValue;
    emailVerified: boolean;
    hashedPassword: string;
    refreshTokens: RefreshTokenValue[];
  }) {
    this.identity = parameters.identity;
    this.email = parameters.email;
    this.emailVerified = parameters.emailVerified;
    this.hashedPassword = parameters.hashedPassword;
    this._refreshTokens = parameters.refreshTokens;
  }

  public get refreshTokens() {
    return this._refreshTokens;
  }

  public rotateRefreshToken(
    payload: TokenPayload,
    clock: ClockInterface,
  ): void {
    const nonExpired = this.refreshTokens.filter(
      (refreshToken) => refreshToken.exp > clock.nowAsSecondsSinceEpoch(),
    );
    const refreshTokenPerClient = new Map(
      nonExpired.map((token) => [token.clientId, token]),
    );
    refreshTokenPerClient.set(
      payload.aud,
      RefreshTokenValue.fromTokenPayload(payload),
    );
    this._refreshTokens = Array.from(refreshTokenPerClient.values());
  }

  public hasRefreshToken(jti: IdentityValue, clock: ClockInterface): boolean {
    const validRefreshToken = this._refreshTokens.find(
      (refreshToken) =>
        refreshToken.jti === jti.toString() &&
        refreshToken.exp > clock.nowAsSecondsSinceEpoch(),
    );
    return validRefreshToken !== undefined;
  }
}
