import { Inject, Injectable } from "@nestjs/common";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { IdentityValue } from "@domain/IdentityValue";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";

import {
  PasswordInterface,
  PasswordInterfaceSymbol,
} from "@domain/authentication/OAuth/User/Credentials/Password.interface";

import { AuthConfig } from "@infrastructure/config/configs";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import {
  PKCEInterface,
  PKCEInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/PKCE.interface";
import {
  TokenPayloadInterface,
  TokenPayloadInterfaceSymbol,
} from "@domain/authentication/OAuth/Token/TokenPayload.interface";
import {
  RequestInterface,
  RequestInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/Request.interface";
import {
  ClientInterface,
  ClientInterfaceSymbol,
} from "@domain/authentication/OAuth/Client/Client.interface";
import {
  UsersInterface,
  UsersInterfaceSymbol,
} from "@domain/authentication/OAuth/User/Users.interface";
import {
  CodeInterface,
  CodeInterfaceSymbol,
} from "@domain/authentication/OAuth/Authorization/Code/Code.interface";
import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  async request(params: {
    id: IdentityValue;
    clientId: IdentityValue;
    redirectUri: HttpUrlValue;
    scope: ScopeValueImmutableSet;
    state: string;
    codeChallenge: string;
  }): Promise<Request> {
    throw new Error("Not implemented");
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
