import { isUUID } from "class-validator";
import * as assert from "assert";
import { v4 } from "uuid";

export class IdentityValue {
  private constructor(public readonly identity: string) {
    assert(isUUID(identity, "4"));
  }

  public static create(): IdentityValue {
    return IdentityValue.fromString(v4());
  }

  public static fromString(identity: string): IdentityValue {
    return new IdentityValue(identity);
  }

  public toString() {
    return this.identity;
  }

  public isEqual(otherIdentity: IdentityValue): boolean {
    return this.identity.toString() === otherIdentity.toString();
  }
}
