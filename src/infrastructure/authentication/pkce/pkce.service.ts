import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";

import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE.interface";

@Injectable()
export class PKCEService implements PKCEInterface {
  public verify({
    codeChallenge,
    codeVerifier,
  }: {
    codeChallenge: string;
    codeVerifier: string;
  }): boolean {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const verifier = createHash("sha256").update(data).digest("base64url");
    return verifier === codeChallenge;
  }
}
