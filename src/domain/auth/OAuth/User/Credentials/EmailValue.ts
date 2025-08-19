import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/auth/OAuth/Errors";

export class EmailValue {
  private constructor(private readonly email: string) {
    Assert(
      email.length === email.trim().length,
      () =>
        new OauthInvalidRequestException({
          errorDescription:
            "Email cannot start and/or end with a space character(s)",
        }),
    );
    Assert(
      email.includes("@"),
      () =>
        new OauthInvalidRequestException({
          errorDescription: "No local and domain part separator in email",
        }),
    );
    Assert(
      email.length <= 254,
      () =>
        new OauthInvalidRequestException({
          errorDescription: "Email is too long",
        }),
    );
  }

  public static fromString(email: string) {
    return new EmailValue(email);
  }

  public static fromUnknown(email: unknown) {
    Assert(
      typeof email === "string" || email instanceof EmailValue,
      () =>
        new OauthInvalidRequestException({
          message: "email value has to be instance of EmailValue or string",
        }),
    );
    if (typeof email === "string") {
      return EmailValue.fromString(email);
    }
    return email;
  }

  public isEqual(email: EmailValue): boolean {
    return this.email.toLowerCase() === email.toString().toLowerCase();
  }

  public toString(): string {
    return this.email;
  }
}
