import { Assert } from "@domain/Assert";
import { OauthUnsupportedResponseTypeException } from "@domain/authentication/OAuth/Errors";

export class ResponseTypeValue {
  private constructor(private readonly responseType: string) {
    Assert(
      responseType === "code",
      new OauthUnsupportedResponseTypeException({
        message:
          "Only accepted authorization flow at the moment is Authorization Code flow with PKCE",
      }),
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
