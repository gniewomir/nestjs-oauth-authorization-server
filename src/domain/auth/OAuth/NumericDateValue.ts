import { isInt } from "class-validator";

import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";

/**
 * A JSON numeric value representing the number of seconds from 1970-01-01T00:00:00Z UTC
 * until the specified UTC date/time, ignoring leap seconds.
 *
 * This is the format expected from jwt claims exp, nbf and iat.
 */
export class NumericDateValue {
  constructor(private readonly secondsSinceEpoch: number) {
    Assert(
      secondsSinceEpoch > 0 && isInt(secondsSinceEpoch),
      () =>
        new OauthInvalidRequestException({
          errorDescription: "NumericDateValue must be a positive integer",
        }),
    );
  }

  public static fromNumber(value: number): NumericDateValue {
    return new NumericDateValue(value);
  }

  public static fromString(value: string) {
    return new NumericDateValue(parseInt(value, 10));
  }

  public static fromUnknown(value: unknown) {
    Assert(
      value instanceof NumericDateValue ||
        typeof value === "string" ||
        typeof value === "number",

      "NumericDateValue must be a string, number or NumericDateValue instance",
    );
    if (typeof value === "number") {
      return NumericDateValue.fromNumber(value);
    }
    if (typeof value === "string") {
      return NumericDateValue.fromString(value);
    }
    return value;
  }

  public toNumber(): number {
    return this.secondsSinceEpoch;
  }
}
