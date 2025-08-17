import * as assert from "node:assert";

import {
  decode as jwt_decode,
  sign as jwt_sign,
  verify as jwt_verify,
} from "jsonwebtoken";

import { IdTokenPayload } from "@domain/authentication/OAuth/Token/IdTokenPayload";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/authentication/OAuth/Token/TokenPayloads.interface";
import { AuthConfig } from "@infrastructure/config/configs";

export class JwtServiceFake implements TokenPayloadsInterface {
  constructor(private readonly authConfig: AuthConfig) {}

  verifyIdToken(idToken: string): Promise<IdTokenPayload> {
    const verified = jwt_verify(idToken, this.authConfig.jwtSecret, {
      algorithms: [this.authConfig.jwtAlgorithm],
      complete: false,
    });

    assert(typeof verified === "object");

    return Promise.resolve(IdTokenPayload.fromUnknown(verified));
  }

  decode(token: string): Promise<TokenPayload> {
    const payload = jwt_decode(token, {
      complete: false,
    });

    assert(payload);
    assert(typeof payload === "object");

    return Promise.resolve(TokenPayload.fromUnknown(payload));
  }

  sign(tokenPayload: Record<string, unknown>): Promise<string> {
    const signed = jwt_sign(tokenPayload, this.authConfig.jwtSecret, {
      algorithm: this.authConfig.jwtAlgorithm,
    });
    return Promise.resolve(signed);
  }

  verify(token: string): Promise<TokenPayload> {
    const verified = jwt_verify(token, this.authConfig.jwtSecret, {
      algorithms: [this.authConfig.jwtAlgorithm],
      complete: false,
    });

    assert(typeof verified === "object");

    return Promise.resolve(TokenPayload.fromUnknown(verified));
  }
}
