import { Assert } from "@domain/Assert";

export class EmailValue {
  private constructor(private readonly email: string) {
    Assert(
      email.length === email.trim().length,
      "Email cannot start and/or end with a space character(s)",
    );
    Assert(email.includes("@"), "No local and domain part separator in email");
    Assert(email.length <= 254, "Email is too long");
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
