import { Inject, Injectable } from "@nestjs/common";

import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
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
import { AuthConfig } from "@infrastructure/config/configs";

@Injectable()
export class AuthorizationService {
  constructor(
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
    scope: string;
    state: string;
    codeChallengeMethod: string;
    codeChallenge: string;
  }): Promise<{
    requestId: string;
  }> {
    const request = await AuthorizationFacade.request(
      {
        clientId: IdentityValue.fromString(clientId),
        responseType: ResponseTypeValue.fromString(responseType),
        id: IdentityValue.create(),
        redirectUri: HttpUrlValue.fromString(redirectUri),
        scope: ScopeValueImmutableSet.fromUnknown(scope),
        state,
        codeChallenge,
        codeChallengeMethod:
          CodeChallengeMethodValue.fromString(codeChallengeMethod),
      },
      this.requests,
      this.clients,
    );

    return {
      requestId: request.id.toString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async prompt(params: {
    requestId: IdentityValue;
    credentials: {
      email: EmailValue;
      password: PasswordValue;
      rememberMe: boolean;
    };
  }): Promise<{ authorizationCode: Code }> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async codeExchange(params: {
    clientId: IdentityValue;
    code: string;
    codeVerifier: string;
    redirectUri: HttpUrlValue;
  }): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    throw new Error("Not implemented");
  }
}
