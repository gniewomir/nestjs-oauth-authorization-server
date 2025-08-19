import * as assert from "node:assert";

import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcrypt";

import { PasswordInterface } from "@domain/auth/OAuth/User/Credentials/Password.interface";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";

@Injectable()
export class PasswordService implements PasswordInterface {
  constructor(private readonly authConfig: AuthConfig) {}

  comparePlaintextAndHashedPassword(
    passwordPlainText: string,
    passwordHash: string,
  ): Promise<boolean> {
    assert(passwordHash.length === 60, "Unexpected length of password hash!");
    return compare(passwordPlainText, passwordHash);
  }

  hashPlaintextPassword(passwordPlaintext: string): Promise<string> {
    assert(
      this.authConfig.passwordSaltingRounds >= 10,
      "Too low number of hashing rounds!",
    );
    return hash(passwordPlaintext, this.authConfig.passwordSaltingRounds);
  }
}
