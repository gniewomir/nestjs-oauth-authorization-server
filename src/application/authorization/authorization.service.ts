import { Inject, Injectable } from "@nestjs/common";

import { Assert } from "@domain/Assert";
import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import {
  CodeInterface,
  CodeInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import {
  PKCEInterface,
  PKCEInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/PKCE/PKCE.interface";
import {
  RequestInterface,
  RequestInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/Request.interface";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import {
  ClientInterface,
  ClientInterfaceSymbol,
} from "@domain/authentication/OAuth/Client/Client.interface";
import { RedirectUriValue } from "@domain/authentication/OAuth/RedirectUriValue";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import {
  TokenPayloadInterface,
  TokenPayloadInterfaceSymbol,
} from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import {
  PasswordInterface,
  PasswordInterfaceSymbol,
} from "@domain/authentication/OAuth/User/Credentials/Password.interface";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import {
  UsersInterface,
  UsersInterfaceSymbol,
} from "@domain/authentication/OAuth/User/Users.interface";
import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly authConfig: AuthConfig,
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
    @Inject(RequestInterfaceSymbol)
    private readonly requests: RequestInterface,
    @Inject(ClientInterfaceSymbol)
    private readonly clients: ClientInterface,
    @Inject(UsersInterfaceSymbol)
    private readonly users: UsersInterface,
    @Inject(CodeInterfaceSymbol)
    private readonly codes: CodeInterface,
    @Inject(PasswordInterfaceSymbol)
    private readonly passwords: PasswordInterface,
    @Inject(PKCEInterfaceSymbol)
    private readonly pkce: PKCEInterface,
    @Inject(TokenPayloadInterfaceSymbol)
    private readonly tokenPayloads: TokenPayloadInterface,
  ) {}

  async request({
    clientId,
    responseType,
    redirectUri,
    scope,
    state,
    codeChallenge,
    codeChallengeMethod,
  }: {
    clientId: string;
    responseType: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    codeChallengeMethod?: string;
    codeChallenge?: string;
  }): Promise<{
    requestId: string;
  }> {
    const request = await AuthorizationFacade.request(
      {
        clientId: IdentityValue.fromString(clientId),
        responseType: ResponseTypeValue.fromString(responseType),
        id: IdentityValue.create(),
        redirectUri: RedirectUriValue.create(redirectUri, this.appConfig.env),
        scope: scope
          ? ScopeValueImmutableSet.fromString(scope)
          : ScopeValueImmutableSet.fromArray([]),
        state: state || "",
        codeChallenge: codeChallenge || "",
        codeChallengeMethod: codeChallengeMethod
          ? CodeChallengeMethodValue.fromString(codeChallengeMethod)
          : CodeChallengeMethodValue.METHOD_NONE(),
      },
      this.requests,
      this.clients,
    );

    return {
      requestId: request.id.toString(),
    };
  }

  async preparePrompt({ requestId }: { requestId: string }) {
    const request = await this.requests.retrieve(
      IdentityValue.fromString(requestId),
    );
    const client = await this.clients.retrieve(request.clientId);
    return {
      allowRememberMe: request.scope.hasScope(
        ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL(),
      ),
      requestId: request.id.toString(),
      requestedScopes: request.scope.describe(),
      redirectUri: request.redirectUri.toString(),
      clientName: client.name,
    };
  }

  async submitPrompt(params: {
    requestId: string;
    credentials: {
      email: string;
      password: string;
      rememberMe?: boolean;
    };
    scopes?: string[];
  }): Promise<{
    code: string;
  }> {
    const request = await AuthorizationFacade.prompt(
      {
        requestId: IdentityValue.fromString(params.requestId),
        credentials: {
          email: EmailValue.fromString(params.credentials.email),
          password: PasswordValue.fromString(params.credentials.password),
          rememberMe: params.credentials.rememberMe || false,
        },
      },
      this.requests,
      this.users,
      this.passwords,
      this.codes,
      this.clock,
      this.authConfig,
    );

    Assert(request.authorizationCode instanceof Code);

    return {
      code: request.authorizationCode.code,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async codeExchange(params: {
    clientId: IdentityValue;
    code: string;
    codeVerifier: string;
    redirectUri: RedirectUriValue;
  }): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    throw new Error("Not implemented");
  }
}
