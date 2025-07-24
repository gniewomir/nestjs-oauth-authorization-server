import { isUUID } from "class-validator";
import * as assert from "assert";

export class IdentityValue {
  private constructor(public readonly identity: string) {
    assert(isUUID(identity, "4"));
  }

  public static fromString(identity: string): IdentityValue {
    return new IdentityValue(identity);
  }

  public toString() {
    return this.identity;
  }
}
