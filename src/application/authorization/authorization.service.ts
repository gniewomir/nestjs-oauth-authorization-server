import { Injectable, Inject } from "@nestjs/common";
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
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";

import { RequestDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository";
import { ClientDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository";
import { UserDomainRepository } from "@infrastructure/repositories/domain/authentication/OAuth/User/User.domain-repository";
import { ClockService } from "@infrastructure/clock/clock.service";
import { AuthorizationCodeService } from "@infrastructure/authentication/authorization-code/authorization-code.service";

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly requests: RequestDomainRepository,
    private readonly clients: ClientDomainRepository,
    private readonly users: UserDomainRepository,
    @Inject(PasswordInterfaceSymbol)
    private readonly passwords: PasswordInterface,
    private readonly codes: AuthorizationCodeService,
    private readonly clock: ClockService,
    private readonly authConfig: AuthConfig,
    @Inject(PKCEInterfaceSymbol) private readonly pkce: PKCEInterface,
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
