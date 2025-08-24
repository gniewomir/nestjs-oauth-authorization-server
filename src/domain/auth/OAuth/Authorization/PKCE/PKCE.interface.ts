import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { CodeChallengeValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeValue";

export interface PKCEInterface {
  verify({
    codeChallenge,
    codeVerifier,
    method,
  }: {
    codeChallenge: CodeChallengeValue;
    codeVerifier: string;
    method: CodeChallengeMethodValue;
  }): boolean;
}

export const PKCEInterfaceSymbol = Symbol.for("PKCEInterface");
