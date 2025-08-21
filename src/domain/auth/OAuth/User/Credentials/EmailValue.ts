import { Assert } from "@domain/Assert";
import { EmailSanitizerInterface } from "@domain/auth/OAuth/User/Credentials/EmailSanitizer.interface";
import { UserInvalidEmailException } from "@domain/auth/OAuth/User/Errors/UserInvalidEmailException";

export class EmailValue {
  private constructor(private readonly email: string) {}

  public static create(
    email: string,
    sanitizer: EmailSanitizerInterface,
  ): EmailValue {
    Assert(
      sanitizer.isValidEmail(email),
      () =>
        new UserInvalidEmailException({
          message: `Email sanitization failed with code "${sanitizer.sanitizeEmail(email).message}"`,
        }),
    );
    return EmailValue.fromString(email);
  }

  public static fromString(email: string) {
    return new EmailValue(email);
  }

  public isEqual(email: EmailValue): boolean {
    return this.email.toLowerCase() === email.toString().toLowerCase();
  }

  public toString(): string {
    return this.email;
  }
}
