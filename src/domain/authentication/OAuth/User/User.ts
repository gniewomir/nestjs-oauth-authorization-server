import { IdentityValue } from "@domain/IdentityValue";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { RefreshTokenValue } from "@domain/authentication/OAuth/User/RefreshTokenValue";
import { ClockInterface } from "@domain/Clock.interface";

export type TUserConstructorArgs = ConstructorParameters<typeof User>;
export type TUserConstructorParam = TUserConstructorArgs[0];

export class User {
  public readonly identity: IdentityValue;
  public readonly email: EmailValue;
  public readonly emailVerified: boolean;
  public readonly password: string;
  private _refreshTokens: RefreshTokenValue[];

  constructor(parameters: {
    identity: IdentityValue;
    email: EmailValue;
    emailVerified: boolean;
    password: string;
    refreshTokens: RefreshTokenValue[];
  }) {
    this.identity = parameters.identity;
    this.email = parameters.email;
    this.emailVerified = parameters.emailVerified;
    this.password = parameters.password;
    this._refreshTokens = parameters.refreshTokens;
  }

  public get refreshTokens() {
    return this._refreshTokens;
  }

  public rotateRefreshToken(
    refreshToken: RefreshTokenValue,
    clock: ClockInterface,
  ): void {
    const nonExpired = this._refreshTokens.filter(
      (token) => token.exp > clock.nowAsSecondsSinceEpoch(),
    );
    const onlyOtherClients = nonExpired.filter(
      (token) => refreshToken.aud !== token.aud,
    );
    const clients = new Map(
      onlyOtherClients.map((token) => [token.aud, token]),
    );
    clients.set(refreshToken.aud, RefreshTokenValue.fromUnknown(refreshToken));
    this._refreshTokens = Array.from(clients.values());
  }

  public hasRefreshToken(jti: IdentityValue, clock: ClockInterface): boolean {
    const validRefreshToken = this._refreshTokens.find(
      (refreshToken) =>
        IdentityValue.fromString(refreshToken.jti).isEqual(jti) &&
        refreshToken.exp > clock.nowAsSecondsSinceEpoch(),
    );
    return validRefreshToken !== undefined;
  }

  public spendRefreshToken(jti: IdentityValue) {
    this._refreshTokens = this._refreshTokens.filter(
      (token) => token.jti !== jti.toString(),
    );
  }
}
