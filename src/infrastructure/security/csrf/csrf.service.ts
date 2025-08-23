import * as crypto from "node:crypto";

import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";

import { ClockInterface, ClockInterfaceSymbol } from "@domain/Clock.interface";

export interface CsrfToken {
  token: string;
  requestId: string;
  expiresAt: number;
}

@Injectable()
export class CsrfService {
  private readonly tokens = new Map<string, CsrfToken>();
  private readonly tokenExpirationSeconds = 300; // 5 minutes

  constructor(
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
  ) {}

  generateToken(requestId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt =
      this.clock.nowAsSecondsSinceEpoch() + this.tokenExpirationSeconds;

    this.tokens.set(requestId, {
      token,
      requestId,
      expiresAt,
    });

    return token;
  }

  validateToken(requestId: string, token: string): boolean {
    const storedToken = this.tokens.get(requestId);

    if (!storedToken) {
      return false;
    }

    if (storedToken.expiresAt < this.clock.nowAsSecondsSinceEpoch()) {
      this.tokens.delete(requestId);
      return false;
    }

    if (storedToken.token !== token) {
      return false;
    }

    // Remove token after successful validation to prevent replay attacks
    this.tokens.delete(requestId);
    return true;
  }

  cleanupExpiredTokens(): void {
    const now = this.clock.nowAsSecondsSinceEpoch();
    for (const [requestId, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(requestId);
      }
    }
  }
}
