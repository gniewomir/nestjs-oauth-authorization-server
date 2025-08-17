import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";

enum CodeChallengeMethodsEnum {
  S256 = "S256",
  PLAIN = "plain",
  NONE = "none",
}

export class CodeChallengeMethodValue {
  private constructor(private readonly method: string) {
    Assert(
      Object.values(CodeChallengeMethodsEnum)
        .map((val) => val.toString())
        .includes(method),
      () =>
        new OauthInvalidRequestException({
          developerMessage: `Accepted code challenge methods are ${Object.values(CodeChallengeMethodsEnum).join(", ")}`,
        }),
    );
  }

  public static METHOD_S256(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString(
      CodeChallengeMethodsEnum.S256.toString(),
    );
  }

  public static METHOD_PLAIN(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString(
      CodeChallengeMethodsEnum.PLAIN.toString(),
    );
  }

  public static METHOD_NONE(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString(
      CodeChallengeMethodsEnum.NONE.toString(),
    );
  }

  public static fromString(value: string) {
    return new CodeChallengeMethodValue(value);
  }

  public static fromUnknown(value: unknown) {
    if (!value) {
      return CodeChallengeMethodValue.METHOD_NONE();
    }
    Assert(typeof value === "string");
    return new CodeChallengeMethodValue(value);
  }

  public toString(): string {
    return this.method;
  }

  public isEqual(value: CodeChallengeMethodValue) {
    return this.toString() === value.toString();
  }
}
