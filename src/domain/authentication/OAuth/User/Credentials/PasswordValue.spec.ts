import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { PasswordService } from "@infrastructure/authentication/password/password.service";
import { plainToConfig } from "@infrastructure/config/configs/utility";
import {
  AuthConfig,
  authConfigDefaults,
} from "@infrastructure/config/configs/auth.config";

describe("PasswordValue", () => {
  it("Prevents creation of passwords starting with spaces", () => {
    expect(() => {
      PasswordValue.fromString("  abcdefghijkl");
    }).toThrow(`Password cannot start and/or end with a space character(s)`);
  });
  it("Prevents creation of passwords ending with spaces", () => {
    expect(() => {
      PasswordValue.fromString("abcdefghijkl  ");
    }).toThrow(`Password cannot start and/or end with a space character(s)`);
  });
  it("Prevents creation of password shorter than 'minPasswordLength'", () => {
    expect(() => {
      PasswordValue.fromString("abc");
    }).toThrow(`Minimal password length is ${PasswordValue.minPasswordLength}`);
  });
  it("Prevents creation of password where at least 'minUniqueCharacters' is unique", () => {
    expect(() => {
      PasswordValue.fromString("aaabbbcccddd");
    }).toThrow(
      `Minimal number of unique characters in password is ${PasswordValue.minUniqueCharacters}`,
    );
  });
  it("Prevents creation of password longer than 72 bytes, because of bcrypt limitations", () => {
    const passwordOver72bytesLong = "abcdefghijkl".padEnd(72, "😃");
    expect(() => {
      PasswordValue.fromString(passwordOver72bytesLong);
    }).toThrow("Password should not be longer than 72 bytes");
  });
  it("Hashes plaintext password", async () => {
    const expectedLengthOfBcryptHash = 60;
    await expect(
      PasswordValue.fromString("abcdefghijkl").toPasswordHash(
        new PasswordService(
          await plainToConfig(authConfigDefaults, AuthConfig),
        ),
      ),
    ).resolves.toHaveLength(expectedLengthOfBcryptHash);
  });
  it("It can compare plaintext password with correct hash", async () => {
    const plaintextPassword = "abcdefghijkl";
    const hasher = new PasswordService(
      await plainToConfig(authConfigDefaults, AuthConfig),
    );
    const hashedPassword =
      await PasswordValue.fromString(plaintextPassword).toPasswordHash(hasher);
    await expect(
      PasswordValue.fromString(plaintextPassword).isEqualHashedPassword(
        hashedPassword,
        hasher,
      ),
    ).resolves.toEqual(true);
  });
  it("It can compare plaintext password with invalid hash", async () => {
    const plaintextPassword = "abcdefghijkl";
    const hasher = new PasswordService(
      await plainToConfig(authConfigDefaults, AuthConfig),
    );
    const invalidPasswordHash = "invalid-hash".padEnd(60, "X");
    await expect(
      PasswordValue.fromString(plaintextPassword).isEqualHashedPassword(
        invalidPasswordHash,
        hasher,
      ),
    ).resolves.toEqual(false);
  });
});
