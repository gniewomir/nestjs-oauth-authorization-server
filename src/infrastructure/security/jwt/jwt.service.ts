import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";

import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/authentication/OAuth/Token/TokenPayloads.interface";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";

@Injectable()
export class JwtService implements TokenPayloadsInterface {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly authConfig: AuthConfig,
  ) {}

  async verify(token: string): Promise<TokenPayload> {
    return TokenPayload.fromUnknown(
      await this.jwtService.verifyAsync(token, {
        algorithms: [this.authConfig.jwtAlgorithm],
        secret: this.authConfig.jwtSecret,
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
    return await this.jwtService.signAsync(tokenPayload, {
      algorithm: this.authConfig.jwtAlgorithm,
      secret: this.authConfig.jwtSecret,
    });
  }
}
