import { IdentityValue } from "@domain/IdentityValue";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Token/Scope/ScopeValueImmutableSet";
import { Assert } from "@domain/Assert";

export type TRequestConstructorArgs = ConstructorParameters<typeof Request>;
export type TRequestConstructorParam = TRequestConstructorArgs[0];

export class Request {
  public readonly id: IdentityValue;
  public readonly clientId: IdentityValue;
  public readonly redirectUri: HttpUrlValue;
  public readonly state: string;
  public readonly codeChallenge: string;
  public readonly scope: ScopeValueImmutableSet;

  constructor(params: {
    id: IdentityValue;
    clientId: IdentityValue;
    redirectUri: HttpUrlValue;
    scope: ScopeValueImmutableSet;
    state: string;
    codeChallenge: string;
    authorizationCode: Code | null;
  }) {
    this.id = params.id;
    this.clientId = params.clientId;
    this.redirectUri = params.redirectUri;
    this.state = params.state;
    this.scope = params.scope;
    this.codeChallenge = params.codeChallenge;
    this._authorizationCode = params.authorizationCode;
  }

  private _authorizationCode: Code | null;

  public get authorizationCode(): Code | null {
    return this._authorizationCode;
  }

  public static async create(
    params: Omit<TRequestConstructorParam, "authorizationCode">,
    clientInterface: ClientInterface,
  ) {
    Assert(
      (await clientInterface.retrieve(params.clientId)) instanceof Client,
      "OAuth client does not exist",
    );
    return new Request({
      ...params,
      authorizationCode: null,
    });
  }

  public issueAuthorizationCode(
    userId: IdentityValue,
    authorizationCodeInterface: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ) {
    this._authorizationCode = Code.create(
      userId,
      authorizationCodeInterface,
      clock,
      authConfig,
    );
  }

  public useAuthorizationCode(code: string, clock: ClockInterface): boolean {
    const knownCode = this._authorizationCode;
    Assert(
      knownCode !== null,
      "Authorisation code was not yet issued for this authorization request",
    );
    Assert(
      knownCode.use(clock) === code,
      "Failed authorization code verification",
    );

    return true;
  }
}
