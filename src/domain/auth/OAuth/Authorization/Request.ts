import { Assert } from "@domain/Assert";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { IntentValue } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { ResolutionValue } from "@domain/auth/OAuth/Authorization/ResolutionValue";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { Client } from "@domain/auth/OAuth/Client/Client";
import { ClientInterface } from "@domain/auth/OAuth/Client/Client.interface";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import {
  OauthInvalidCredentialsException,
  OauthInvalidRequestException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export type TRequestConstructorArgs = ConstructorParameters<typeof Request>;
export type TRequestConstructorParam = TRequestConstructorArgs[0];

export class Request {
  public readonly id: IdentityValue;
  public readonly clientId: IdentityValue;
  public readonly redirectUri: RedirectUriValue;
  public readonly state: string | null;
  public readonly codeChallenge: string;
  public readonly codeChallengeMethod: CodeChallengeMethodValue;
  public readonly scope: ScopeValueImmutableSet;
  public readonly responseType: ResponseTypeValue;
  public readonly intent: IntentValue | null;
  public readonly resolution: ResolutionValue;

  constructor(params: {
    id: IdentityValue;
    responseType: ResponseTypeValue;
    clientId: IdentityValue;
    redirectUri: RedirectUriValue;
    scope: ScopeValueImmutableSet;
    state: string | null;
    codeChallenge: string;
    codeChallengeMethod: CodeChallengeMethodValue;
    intent: IntentValue | null;
    authorizationCode: Code | null;
    resolution: ResolutionValue;
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
    this.resolution = params.resolution;
    this.intent = params.intent;
  }

  private _authorizationCode: Code | null;

  public get authorizationCode(): Code | null {
    return this._authorizationCode;
  }

  public static async create(
    params: Omit<TRequestConstructorParam, "authorizationCode" | "resolution">,
    clientInterface: ClientInterface,
  ) {
    Assert(
      (await clientInterface.retrieve(params.clientId)) instanceof Client,
      () =>
        new OauthInvalidCredentialsException({
          message: "OAuth client does not exist",
        }),
    );
    return new Request({
      ...params,
      resolution: ResolutionValue.PENDING(),
      authorizationCode: null,
    });
  }

  public issueAuthorizationCode(
    userId: IdentityValue,
    authorizationCodeInterface: CodeInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ) {
    Assert(
      this.resolution.isNotResolved(),
      () =>
        new OauthInvalidRequestException({
          message:
            "Cannot issue authorization code for already resolved authorization request",
        }),
    );
    this._authorizationCode = Code.create(
      userId,
      authorizationCodeInterface,
      clock,
      authConfig,
    );
  }
}
