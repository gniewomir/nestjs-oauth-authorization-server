import { Assert } from "@domain/Assert";
import { PasswordInterface } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { UserInvalidPasswordException } from "@domain/auth/OAuth/User/Errors/UserInvalidPasswordException";

export class PasswordValue {
  public static readonly minPasswordLength: number = 12;
  public static readonly minUniqueCharacters: number = 6;

  private constructor(private readonly password: string) {}

  public static create(password: string): PasswordValue {
    Assert(
      password.length === password.trim().length,
      () =>
        new UserInvalidPasswordException({
          errorCode: "invalid-password",
          message: "Password cannot start and/or end with a space character(s)",
        }),
    );
    Assert(
      password.length >= PasswordValue.minPasswordLength,
      () =>
        new UserInvalidPasswordException({
          errorCode: "password-too-short",
          message: `Minimal password length is ${PasswordValue.minPasswordLength}`,
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
        new UserInvalidPasswordException({
          errorCode: "password-too-weak",
          message: `Minimal number of unique characters in password is ${PasswordValue.minUniqueCharacters}`,
        }),
    );
    // ref https://www.npmjs.com/package/bcrypt#user-content-security-issues-and-concerns
    Assert(
      new Blob([password]).size <= 72, // size in bytes
      () =>
        new UserInvalidPasswordException({
          errorCode: "password-too-long",
          message: "Password should not be longer than 72 bytes",
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
