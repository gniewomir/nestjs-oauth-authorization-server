import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth";

export class CodeChallengeValue {
  private constructor(private readonly value: string) {
    Assert(
      value.length >= 43 && value.length <= 128,
      () =>
        new OauthInvalidRequestException({
          errorDescription: "Invalid code challenge length",
        }),
    );
  }

  public toString(): string {
    return this.value;
  }

  public static fromUnknown(value: unknown): CodeChallengeValue {
    Assert(
      typeof value === "string" && value.length > 0,
      () =>
        new OauthInvalidRequestException({
          errorDescription: "Missing code challenge",
        }),
    );
    return new CodeChallengeValue(value);
  }

  public static fromString(value: string): CodeChallengeValue {
    return new CodeChallengeValue(value);
  }
}
