import { Assert } from "@domain/Assert";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { ClientInterface } from "@domain/authentication/OAuth/Client/Client.interface";
import { OAuthAccessDeniedException } from "@domain/authentication/OAuth/Errors/OauthAccessDeniedException";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export type TRequestConstructorArgs = ConstructorParameters<typeof Request>;
export type TRequestConstructorParam = TRequestConstructorArgs[0];

export class Request {
  public readonly id: IdentityValue;
  public readonly clientId: IdentityValue;
  public readonly redirectUri: HttpUrlValue;
  public readonly state: string;
  public readonly codeChallenge: string;
  public readonly codeChallengeMethod: CodeChallengeMethodValue;
  public readonly scope: ScopeValueImmutableSet;
  public readonly responseType: ResponseTypeValue;

  constructor(params: {
    id: IdentityValue;
    responseType: ResponseTypeValue;
    clientId: IdentityValue;
    redirectUri: HttpUrlValue;
    scope: ScopeValueImmutableSet;
    state: string;
    codeChallenge: string;
    codeChallengeMethod: CodeChallengeMethodValue;
    authorizationCode: Code | null;
  }) {
    Assert(
      params.responseType.isEqual(ResponseTypeValue.TYPE_CODE()),
      "Authorization Code flow is currently the only one supported",
    );
    this.id = params.id;
    this.responseType = params.responseType;
    this.clientId = params.clientId;
    this.redirectUri = params.redirectUri;
    this.state = params.state;
    this.scope = params.scope;
    this.codeChallenge = params.codeChallenge;
    this.codeChallengeMethod = params.codeChallengeMethod;
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

  public useAuthorizationCode(code: string, clock: ClockInterface): void {
    const knownCode = this._authorizationCode;
    Assert(
      knownCode !== null,
      () =>
        new OauthInvalidRequestException({
          message:
            "Authorization code was not yet issued for this authorization request",
        }),
    );
    Assert(
      knownCode.use(clock) === code,
      () =>
        new OAuthAccessDeniedException({
          message: "Failed authorization code verification",
        }),
    );
  }
}
