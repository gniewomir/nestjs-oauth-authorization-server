import { Assert } from "@domain/Assert";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors";
import { PasswordInterface } from "@domain/authentication/OAuth/User/Credentials/Password.interface";

export class PasswordValue {
  public static readonly minPasswordLength: number = 12;
  public static readonly minUniqueCharacters: number = 6;

  private constructor(private readonly password: string) {}

  public static create(password: string): PasswordValue {
    Assert(
      password.length === password.trim().length,
      () =>
        new OauthInvalidRequestException({
          errorDescription:
            "Password cannot start and/or end with a space character(s)",
        }),
    );
    Assert(
      password.length >= PasswordValue.minPasswordLength,
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Minimal password length is ${PasswordValue.minPasswordLength}`,
        }),
    );
    Assert(
      password.split("").reduce((acc, char) => {
        if (acc.includes(char)) {
          return acc;
        }
        return acc + char;
      }, "").length >= PasswordValue.minUniqueCharacters,
      () =>
        new OauthInvalidRequestException({
          errorDescription: `Minimal number of unique characters in password is ${PasswordValue.minUniqueCharacters}`,
        }),
    );
    // ref https://www.npmjs.com/package/bcrypt#user-content-security-issues-and-concerns
    Assert(
      new Blob([password]).size <= 72, // size in bytes
      () =>
        new OauthInvalidRequestException({
          errorDescription: "Password should not be longer than 72 bytes",
        }),
    );
    return new PasswordValue(password);
  }

  public static fromString(password: string) {
    return new PasswordValue(password);
  }

  public matchHashedPassword(
    hashedPassword: string,
    passwordInterface: PasswordInterface,
  ): Promise<boolean> {
    return passwordInterface.comparePlaintextAndHashedPassword(
      this.password,
      hashedPassword,
    );
  }

  public toPasswordHash(passwordInterface: PasswordInterface): Promise<string> {
    return passwordInterface.hashPlaintextPassword(this.password);
  }

  public toString(): string {
    return this.password;
  }
}
