import { createHash } from "crypto";
import { Injectable } from "@nestjs/common";
import { PKCEInterface } from "@domain/authentication/PKCE/PKCE.interface";

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
    const hashedVerifier = createHash("sha256").update(data).digest("base64");
    return hashedVerifier === codeChallenge;
  }
}
