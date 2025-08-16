import { isUUID } from "class-validator";
import { v4 } from "uuid";

import { Assert } from "@domain/Assert";

export class IdentityValue {
  private constructor(public readonly identity: string) {
    Assert(isUUID(identity, "4"));
  }

  public static create(): IdentityValue {
    return IdentityValue.fromString(v4());
  }

  public static fromString(identity: string): IdentityValue {
    return new IdentityValue(identity);
  }

  public static isValid(identity: unknown): boolean {
    try {
      IdentityValue.fromUnknown(identity);
      return true;
    } catch {
      return false;
    }
  }

  public static fromUnknown(identity: unknown): IdentityValue {
    Assert(typeof identity === "string" || identity instanceof IdentityValue);
    return typeof identity === "string"
      ? IdentityValue.fromString(identity)
      : identity;
  }

  public toString() {
    return this.identity;
  }

  public isEqual(otherIdentity: IdentityValue): boolean {
    return this.identity.toString() === otherIdentity.toString();
  }
}
