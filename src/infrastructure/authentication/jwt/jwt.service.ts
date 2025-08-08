import { TokenPayloadInterface } from "@domain/authentication/Token/TokenPayload.interface";
import { TokenPayload } from "@domain/authentication/Token/TokenPayload";
import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";

@Injectable()
export class JwtService implements TokenPayloadInterface {
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

  async sign(tokenPayload: TokenPayload): Promise<string> {
    return await this.jwtService.signAsync(tokenPayload, {
      algorithm: this.authConfig.jwtAlgorithm,
      secret: this.authConfig.jwtSecret,
    });
  }
}
