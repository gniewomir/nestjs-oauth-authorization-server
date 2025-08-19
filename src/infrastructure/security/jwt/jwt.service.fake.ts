import * as assert from "node:assert";

import {
  decode as jwt_decode,
  sign as jwt_sign,
  verify as jwt_verify,
} from "jsonwebtoken";

import { IdTokenPayload } from "@domain/auth/OAuth/Token/IdTokenPayload";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/auth/OAuth/Token/TokenPayloads.interface";
import { AuthConfig } from "@infrastructure/config/configs";
import {
  createPrivateKey,
  createPublicKey,
} from "@infrastructure/security/jwt/keys";

export class JwtServiceFake implements TokenPayloadsInterface {
  constructor(private readonly authConfig: AuthConfig) {}

  async verifyIdToken(idToken: string): Promise<IdTokenPayload> {
    const key = await createPublicKey(this.authConfig.jwtKeyPath);
    const verified = jwt_verify(idToken, key, {
      algorithms: [this.authConfig.jwtAlgorithm],
      complete: false,
    });

    assert(typeof verified === "object");

    return IdTokenPayload.fromUnknown(verified);
  }

  decode(token: string): Promise<TokenPayload> {
    const payload = jwt_decode(token, {
      complete: false,
    });

    assert(payload);
    assert(typeof payload === "object");

    return Promise.resolve(TokenPayload.fromUnknown(payload));
  }

  async sign(tokenPayload: Record<string, unknown>): Promise<string> {
    const key = await createPrivateKey(this.authConfig.jwtKeyPath);
    return jwt_sign(tokenPayload, key, {
      algorithm: this.authConfig.jwtAlgorithm,
    });
  }

  async verify(token: string): Promise<TokenPayload> {
    const key = await createPublicKey(this.authConfig.jwtKeyPath);
    const verified = jwt_verify(token, key, {
      algorithms: [this.authConfig.jwtAlgorithm],
      complete: false,
    });

    assert(typeof verified === "object");

    return Promise.resolve(TokenPayload.fromUnknown(verified));
  }
}
