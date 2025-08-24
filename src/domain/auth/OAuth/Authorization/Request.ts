import { Assert } from "@domain/Assert";
import { CodeChallengeValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeValue";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { IntentValue } from "@domain/auth/OAuth/Authorization/IntentValue";
import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { ResolutionValue } from "@domain/auth/OAuth/Authorization/ResolutionValue";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { StateValue } from "@domain/auth/OAuth/Authorization/StateValue";
import { ClientInterface } from "@domain/auth/OAuth/Client/Client.interface";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import {
  OauthInvalidCredentialsException,
  OauthInvalidRequestException,
  OauthInvalidScopeException,
  OauthRedirectUriMismatchException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { NotFoundToDomainException } from "@domain/NotFoundToDomainException";
import { AuthConfig } from "@infrastructure/config/configs";

export type TRequestConstructorArgs = ConstructorParameters<typeof Request>;
export type TRequestConstructorParam = TRequestConstructorArgs[0];

export class Request {
  public readonly id: IdentityValue;
  public readonly clientId: IdentityValue;
  public readonly redirectUri: RedirectUriValue;
  public readonly state: StateValue | null;
  public readonly codeChallenge: CodeChallengeValue;
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
    codeChallenge: CodeChallengeValue;
    codeChallengeMethod: CodeChallengeMethodValue;
    resolution: ResolutionValue;
    authorizationCode: Code | null;
    state: StateValue | null;
    intent: IntentValue | null;
  }) {
    Assert(
      params.responseType.isEqual(ResponseTypeValue.TYPE_CODE()),
      "Authorization Code flow is the only one supported",
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
    params: Omit<
      TRequestConstructorParam,
      "authorizationCode" | "resolution" | "redirectUri"
    > & { redirectUri: RedirectUriValue | null },
    clientInterface: ClientInterface,
  ) {
    const client = await NotFoundToDomainException(
      () => clientInterface.retrieve(params.clientId),
      (error) =>
        new OauthInvalidCredentialsException({
          message: error.message,
        }),
    );
    Assert(
      params.redirectUri === null ||
        client.redirectUri.isEqual(params.redirectUri),
      () =>
        new OauthRedirectUriMismatchException({
          errorDescription:
            "The redirect_uri provided in the request does not match the redirect_uri registered for the client application.",
        }),
    );
    Assert(
      client.scope.isSupersetOf(params.scope),
      () =>
        new OauthInvalidScopeException({
          message: "Requested scope unavailable for provided client",
        }),
    );
    return new Request({
      ...params,
      redirectUri:
        params.redirectUri !== null ? params.redirectUri : client.redirectUri,
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
