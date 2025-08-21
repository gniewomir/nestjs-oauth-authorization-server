import { Assert } from "@domain/Assert";
import { UserInvalidEmailException } from "@domain/auth/OAuth/User/Errors/UserInvalidEmailException";

export class EmailValue {
  private constructor(private readonly email: string) {
    Assert(
      email.length === email.trim().length,
      () =>
        new UserInvalidEmailException({
          errorCode: "invalid-email",
          message: "Email cannot start and/or end with a space",
        }),
    );
    Assert(
      email.includes("@"),
      () =>
        new UserInvalidEmailException({
          errorCode: "invalid-email",
          message: "No local and domain part separator in email",
        }),
    );
    Assert(
      email.length <= 254,
      () =>
        new UserInvalidEmailException({
          errorCode: "invalid-email",
          message: "Email is too long",
        }),
    );
  }

  public static fromString(email: string) {
    return new EmailValue(email);
  }

  public static fromUnknown(email: unknown) {
    Assert(
      typeof email === "string" || email instanceof EmailValue,
      "email value has to be instance of EmailValue or string",
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
