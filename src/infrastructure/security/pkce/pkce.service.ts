import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";

import { Assert } from "@domain/Assert";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE/PKCE.interface";

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
    Assert(
      method.isEqual(CodeChallengeMethodValue.METHOD_S256()),
      "S256 is the only supported code challenge method",
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const verifier = createHash("sha256").update(data).digest("base64url");
    return verifier === codeChallenge;
  }
}
