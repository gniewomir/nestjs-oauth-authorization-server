import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";
import { plainToConfig } from "@infrastructure/config/utility";
import { PasswordService } from "@infrastructure/security/password/password.service";

describe("PasswordValue", () => {
  it("Prevents creation of passwords starting with spaces", () => {
    expect(() => {
      PasswordValue.create("  abcdefghijkl");
    }).toThrow(`Password cannot start and/or end with a space character(s)`);
  });
  it("Prevents creation of passwords ending with spaces", () => {
    expect(() => {
      PasswordValue.create("abcdefghijkl  ");
    }).toThrow(`Password cannot start and/or end with a space character(s)`);
  });
  it("Prevents creation of password shorter than 'minPasswordLength'", () => {
    expect(() => {
      PasswordValue.create("abc");
    }).toThrow(`Minimal password length is ${PasswordValue.minPasswordLength}`);
  });
  it("Prevents creation of password where at least 'minUniqueCharacters' is unique", () => {
    expect(() => {
      PasswordValue.create("aaabbbcccddd");
    }).toThrow(
      `Minimal number of unique characters in password is ${PasswordValue.minUniqueCharacters}`,
    );
  });
  it("Prevents creation of password longer than 72 bytes, because of bcrypt limitations", () => {
    const passwordOver72bytesLong = "abcdefghijkl".padEnd(72, "😃");
    expect(() => {
      PasswordValue.create(passwordOver72bytesLong);
    }).toThrow("Password should not be longer than 72 bytes");
  });
  it("Hashes plaintext password", async () => {
    const expectedLengthOfBcryptHash = 60;
    await expect(
      PasswordValue.fromString("abcdefghijkl").toPasswordHash(
        new PasswordService(
          await plainToConfig(AuthConfig.defaults(), AuthConfig),
        ),
      ),
    ).resolves.toHaveLength(expectedLengthOfBcryptHash);
  });
  it("It can compare plaintext password with correct hash", async () => {
    const plaintextPassword = "abcdefghijkl";
    const hasher = new PasswordService(
      await plainToConfig(AuthConfig.defaults(), AuthConfig),
    );
    const hashedPassword =
      await PasswordValue.fromString(plaintextPassword).toPasswordHash(hasher);
    await expect(
      PasswordValue.fromString(plaintextPassword).matchHashedPassword(
        hashedPassword,
        hasher,
      ),
    ).resolves.toEqual(true);
  });
  it("It can check if plaintext password match hashed one", async () => {
    const plaintextPassword = "abcdefghijkl";
    const hasher = new PasswordService(
      await plainToConfig(AuthConfig.defaults(), AuthConfig),
    );
    const invalidPasswordHash = "invalid-hash".padEnd(60, "X");
    await expect(
      PasswordValue.fromString(plaintextPassword).matchHashedPassword(
        invalidPasswordHash,
        hasher,
      ),
    ).resolves.toEqual(false);
  });
});
