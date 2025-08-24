import { createHash, getRandomValues } from "crypto";

import { CodeChallengeValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeValue";
import { PKCEInterface } from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import { PKCEService } from "@infrastructure/security/pkce/pkce.service";

export class PKCEServiceFake extends PKCEService implements PKCEInterface {
  public generateCodeVerifier() {
    const randomBytes = getRandomValues(new Uint8Array(32));
    return Buffer.from(randomBytes).toString("base64url");
  }

  public generateChallenge(codeVerifier: string) {
    return CodeChallengeValue.fromString(
      createHash("sha256").update(codeVerifier).digest("base64url"),
    );
  }
}
