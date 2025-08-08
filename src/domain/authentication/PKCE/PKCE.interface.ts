export interface PKCEInterface {
  verify({
    codeChallenge,
    codeVerifier,
  }: {
    codeChallenge: string;
    codeVerifier: string;
  }): boolean;
}

export const PKCEInterfaceSymbol = Symbol.for("PKCEInterface");
