import { createHash, getRandomValues } from "crypto";

import { PKCEInterface } from "@domain/authentication/OAuth/Authorization/PKCE/PKCE.interface";
import { PKCEService } from "@infrastructure/authentication/pkce/pkce.service";

export class PKCEServiceFake extends PKCEService implements PKCEInterface {
  public generateCodeVerifier() {
    const randomBytes = getRandomValues(new Uint8Array(32));
    return Buffer.from(randomBytes).toString("base64url");
  }

  public generateChallenge(codeVerifier: string) {
    return createHash("sha256").update(codeVerifier).digest("base64url");
  }
}
