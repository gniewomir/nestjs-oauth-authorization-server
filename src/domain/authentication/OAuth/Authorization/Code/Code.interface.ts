export interface CodeInterface {
  generateAuthorizationCode(): string;
}

export const CodeInterfaceSymbol = Symbol.for("CodeInterface");
