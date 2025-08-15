import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";

enum CodeChallengeMethodsEnum {
  S256 = "S256",
  NONE = "NONE",
}

export class CodeChallengeMethodValue {
  private constructor(private readonly method: string) {
    Assert(
      Object.values(CodeChallengeMethodsEnum)
        .map((val) => val.toString())
        .includes(method),
      () =>
        new OauthInvalidRequestException({
          message: `Accepted code challenge methods are ${Object.values(CodeChallengeMethodsEnum).join(", ")}`,
        }),
    );
  }

  public static METHOD_S256(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString(
      CodeChallengeMethodsEnum.S256.toString(),
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

  public toString(): string {
    return this.method;
  }

  public isEqual(value: CodeChallengeMethodValue) {
    return this.toString() === value.toString();
  }
}
