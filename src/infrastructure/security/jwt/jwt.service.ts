import { KeyObject } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";

import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/auth/OAuth/Token/TokenPayloads.interface";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";
import {
  createPrivateKey,
  loadPublicKey,
} from "@infrastructure/security/jwt/keys";

@Injectable()
export class JwtService implements TokenPayloadsInterface {
  private publicKeyCache: string | undefined;
  private privateKeyCache: KeyObject | undefined;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly authConfig: AuthConfig,
  ) {}

  async verify(token: string): Promise<TokenPayload> {
    this.publicKeyCache = this.publicKeyCache
      ? this.publicKeyCache
      : await loadPublicKey(this.authConfig.jwtKeyPath);
    return TokenPayload.fromUnknown(
      await this.jwtService.verifyAsync(token, {
        algorithms: [this.authConfig.jwtAlgorithm],
        publicKey: this.publicKeyCache,
        complete: false,
      }),
    );
  }

  async decode(token: string): Promise<TokenPayload> {
    const payload: Record<string, unknown> = await this.jwtService.decode(
      token,
      {
        complete: false,
      },
    );

    return TokenPayload.fromUnknown(payload);
  }

  async sign(tokenPayload: Record<string, unknown>): Promise<string> {
    this.privateKeyCache = this.privateKeyCache
      ? this.privateKeyCache
      : await createPrivateKey(this.authConfig.jwtKeyPath);
    return await this.jwtService.signAsync(tokenPayload, {
      algorithm: this.authConfig.jwtAlgorithm,
      privateKey: this.privateKeyCache,
    });
  }
}
