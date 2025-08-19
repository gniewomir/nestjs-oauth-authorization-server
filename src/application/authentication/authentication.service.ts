import { Inject, Injectable } from "@nestjs/common";

import { AuthenticationFacade } from "@domain/auth/Authentication.facade";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import {
  TokenPayloadInterfaceSymbol,
  TokenPayloadsInterface,
} from "@domain/auth/OAuth/Token/TokenPayloads.interface";
import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly authConfig: AuthConfig,
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
    @Inject(TokenPayloadInterfaceSymbol)
    private readonly tokenPayloads: TokenPayloadsInterface,
  ) {}

  async authenticate(token: string): Promise<TokenPayload> {
    return AuthenticationFacade.authenticate(
      token,
      this.tokenPayloads,
      this.clock,
      this.authConfig,
    );
  }
}
