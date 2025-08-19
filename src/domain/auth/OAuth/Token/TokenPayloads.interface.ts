import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";

export interface TokenPayloadsInterface {
  sign(tokenPayload: Record<string, unknown>): Promise<string>;

  decode(token: string): Promise<TokenPayload>;

  verify(token: string): Promise<TokenPayload>;
}

export const TokenPayloadInterfaceSymbol = Symbol.for("TokenPayloadInterface");
