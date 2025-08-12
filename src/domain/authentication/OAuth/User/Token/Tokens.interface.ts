import { IdentityValue } from "@domain/IdentityValue";

export interface TokensInterface {
  removeExpired(now: number): Promise<void>;

  isExpiredOrRevoked(tokenId: IdentityValue): Promise<boolean>;
}
