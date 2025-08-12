import { TokenPayload } from "@domain/authentication/OAuth/User/Token/TokenPayload";
import { IdentityValue } from "@domain/IdentityValue";

export type TTokenConstructorArgs = ConstructorParameters<typeof Token>;
export type TTokenConstructorParam = TTokenConstructorArgs[0];

export class Token {
  public readonly clientId: IdentityValue;
  public readonly refresh: boolean;
  public readonly jti: IdentityValue;
  public readonly sub: IdentityValue;
  public readonly exp: number;

  constructor(params: {
    clientId: IdentityValue;
    refresh: boolean;
    revoked: boolean;
    sub: IdentityValue;
    jti: IdentityValue;
    exp: number;
  }) {
    this.clientId = params.clientId;
    this.sub = params.sub;
    this.jti = params.jti;
    this.exp = params.exp;
    this.refresh = params.refresh;
    this._revoked = params.revoked;
  }

  private _revoked: boolean;

  public get revoked(): boolean {
    return this._revoked;
  }

  public static fromPayload(
    clientId: IdentityValue,
    tokenPayload: TokenPayload,
  ): Token {
    return new Token({
      clientId: clientId,
      revoked: false,
      refresh: false,
      jti: IdentityValue.fromString(tokenPayload.jti),
      sub: IdentityValue.fromString(tokenPayload.sub),
      exp: tokenPayload.exp,
    });
  }

  public revoke() {
    this._revoked = true;
  }
}
