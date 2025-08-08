import { TokenPayload } from "@domain/authentication/Token/TokenPayload";

export interface TokenPayloadInterface {
  sign(tokenPayload: TokenPayload): Promise<string>;

  decode(token: string): Promise<TokenPayload>;

  verify(token: string): Promise<TokenPayload>;
}

export const TokenPayloadInterfaceSymbol = Symbol.for("TokenPayloadInterface");
