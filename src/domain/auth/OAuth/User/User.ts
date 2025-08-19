import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";
import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { RefreshTokenValue } from "@domain/auth/OAuth/User/RefreshTokenValue";
import { UniqueEmailSpecification } from "@domain/auth/OAuth/User/UniqueEmail.specification";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";

type TUserConstructorArgs = ConstructorParameters<typeof User>;
export type TUserConstructorParam = TUserConstructorArgs[0];

export class User {
  public readonly identity: IdentityValue;
  public readonly email: EmailValue;
  public readonly emailVerified: boolean;
  public readonly password: string;

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

  private _refreshTokens: RefreshTokenValue[];

  public get refreshTokens() {
    return this._refreshTokens;
  }

  public static async create(
    params: TUserConstructorParam,
    uniqueEmailSpecification: UniqueEmailSpecification,
  ): Promise<User> {
    Assert(
      await uniqueEmailSpecification.isSatisfied(params.email),
      () =>
        new OauthInvalidRequestException({
          message: "User email have to be unique",
          errorDescription: "user with this email already exists",
        }),
    );
    return new User(params);
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
}
