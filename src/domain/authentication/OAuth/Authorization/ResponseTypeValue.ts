import { Assert } from "@domain/Assert";

export class ResponseTypeValue {
  private constructor(private readonly responseType: string) {
    Assert(
      responseType === "code",
      "Only accepted authorization flow at the moment is Authorization Code flow with PKCE",
    );
  }

  public static TYPE_CODE(): ResponseTypeValue {
    return ResponseTypeValue.fromString("code");
  }

  public static fromString(value: string): ResponseTypeValue {
    return new ResponseTypeValue(value);
  }

  public toString(): string {
    return this.responseType;
  }

  public isEqual(value: ResponseTypeValue): boolean {
    return value.toString() === this.toString();
  }
}
