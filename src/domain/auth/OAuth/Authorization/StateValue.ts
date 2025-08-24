import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth";

export class StateValue {
  private constructor(public readonly value: string) {
    const max = 2048;
    Assert(
      value.length <= max,
      () =>
        new OauthInvalidRequestException({
          errorDescription: `State parameter cannot be longer than ${max}`,
        }),
    );
  }

  public static fromUnknown(value: unknown): StateValue {
    Assert(
      typeof value === "string",
      new OauthInvalidRequestException({
        message: `State parameter have to be a string`,
      }),
    );
    return new StateValue(value);
  }

  public static fromString(value: string): StateValue {
    return new StateValue(value);
  }

  public toString(): string {
    return this.value;
  }
}
