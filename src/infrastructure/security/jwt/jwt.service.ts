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
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly authConfig: AuthConfig,
  ) {}

  async verify(token: string): Promise<TokenPayload> {
    const key = await loadPublicKey(this.authConfig.jwtKeyPath);
    return TokenPayload.fromUnknown(
      await this.jwtService.verifyAsync(token, {
        algorithms: [this.authConfig.jwtAlgorithm],
        publicKey: key,
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
    const key = await createPrivateKey(this.authConfig.jwtKeyPath);
    return await this.jwtService.signAsync(tokenPayload, {
      algorithm: this.authConfig.jwtAlgorithm,
      privateKey: key,
    });
  }
}
