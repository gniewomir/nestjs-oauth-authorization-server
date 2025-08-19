import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";

import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEInterface } from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";

@Injectable()
export class PKCEService implements PKCEInterface {
  public verify({
    codeChallenge,
    codeVerifier,
    method,
  }: {
    codeChallenge: string;
    codeVerifier: string;
    method: CodeChallengeMethodValue;
  }): boolean {
    if (method.isEqual(CodeChallengeMethodValue.METHOD_NONE())) {
      return true;
    }
    if (method.isEqual(CodeChallengeMethodValue.METHOD_PLAIN())) {
      return codeVerifier === codeChallenge;
    }
    if (method.isEqual(CodeChallengeMethodValue.METHOD_S256())) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const verifier = createHash("sha256").update(data).digest("base64url");
      return verifier === codeChallenge;
    }
    throw new OauthInvalidRequestException({
      errorDescription: `Unrecognized code challenge method`,
    });
  }
}
