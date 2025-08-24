import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";

export enum IntentEnum {
  AUTHORIZE_NEW_USER = "authorize_new",
  AUTHORIZE_EXISTING_USER = "authorize_existing",
}

export class IntentValue {
  private constructor(private readonly value: string) {
    Assert(
      Object.values(IntentEnum)
        .map((val) => val.toString())
        .includes(value),
      () =>
        new OauthInvalidRequestException({
          message: "Invalid intent!",
        }),
    );
  }

  static isValidIntent(value: unknown) {
    try {
      IntentValue.fromUnknown(value);
      return true;
    } catch {
      return false;
    }
  }

  static fromString(value: string) {
    return new IntentValue(value);
  }

  static fromUnknown(value: unknown): IntentValue {
    Assert(
      typeof value === "string",
      () =>
        new OauthInvalidRequestException({
          message: "Invalid intent!",
        }),
    );
    return new IntentValue(value);
  }

  static isValid(value: unknown): boolean {
    try {
      IntentValue.fromUnknown(value);
      return true;
    } catch {
      return false;
    }
  }

  static AUTHORIZE_NEW_USER(): string {
    return IntentEnum.AUTHORIZE_NEW_USER;
  }

  static AUTHORIZE_EXISTING_USER(): string {
    return IntentEnum.AUTHORIZE_EXISTING_USER;
  }

  toString(): string {
    return this.value;
  }
}
