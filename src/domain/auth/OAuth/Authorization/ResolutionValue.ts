import { Assert } from "@domain/Assert";
import { assert } from "@interface/api/utility/assert";

export enum ResolutionEnum {
  USER_AUTHORIZED = "authorized",
  USER_DENIED = "denied",
  PENDING = "pending",
}

export class ResolutionValue {
  private constructor(private readonly value: string) {
    Assert(
      Object.values(ResolutionEnum)
        .map((val) => val.toString())
        .includes(value),
      () => new Error("Invalid resolution value!"),
    );
  }

  static fromString(value: string) {
    return new ResolutionValue(value);
  }

  static fromUnknown(value: unknown): ResolutionValue {
    assert(
      typeof value === "string",
      () => new Error("Invalid resolution value!"),
    );
    return new ResolutionValue(value);
  }

  toString(): string {
    return this.value;
  }

  isResolved(): boolean {
    return [
      ResolutionEnum.USER_DENIED.toString(),
      ResolutionEnum.USER_AUTHORIZED.toString(),
    ].includes(this.value);
  }

  isNotResolved(): boolean {
    return !this.isResolved();
  }

  static isValid(value: unknown): boolean {
    try {
      ResolutionValue.fromUnknown(value);
      return true;
    } catch {
      return false;
    }
  }

  static USER_AUTHORIZED(): ResolutionValue {
    return ResolutionValue.fromString(
      ResolutionEnum.USER_AUTHORIZED.toString(),
    );
  }

  static USER_DENIED(): ResolutionValue {
    return ResolutionValue.fromString(ResolutionEnum.USER_DENIED.toString());
  }

  static PENDING(): ResolutionValue {
    return ResolutionValue.fromString(ResolutionEnum.PENDING.toString());
  }
}
