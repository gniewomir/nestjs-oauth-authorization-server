import { Assert } from "@domain/Assert";

export class CodeChallengeMethodValue {
  private constructor(private readonly method: string) {
    Assert(
      method === "S256",
      `Only accepted code challenge method at the moment is S256`,
    );
  }

  public static METHOD_S256(): CodeChallengeMethodValue {
    return CodeChallengeMethodValue.fromString("S256");
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
