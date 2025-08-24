import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";

export enum CodeChallengeMethodsEnum {
  S256 = "S256",
}

export class CodeChallengeMethodValue {
  private constructor(private readonly method: string) {
    Assert(
      Object.values(CodeChallengeMethodsEnum)
        .map((val) => val.toString())
        .includes(method),
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Accepted code challenge methods are ${Object.values(CodeChallengeMethodsEnum).join(", ")}`,
        }),
    );
  }

  public static fromUnknown(value: unknown): CodeChallengeMethodValue {
    Assert(
      typeof value === "string",
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Missing code challenge method`,
        }),
    );
    return new CodeChallengeMethodValue(value);
  }

  public static METHOD_S256(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString(
      CodeChallengeMethodsEnum.S256.toString(),
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
