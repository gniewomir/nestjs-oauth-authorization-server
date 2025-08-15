import { createHash } from "crypto";

import { PasswordInterface } from "@domain/authentication/OAuth/User/Credentials/Password.interface";

export class PasswordServiceFake implements PasswordInterface {
  comparePlaintextAndHashedPassword(
    passwordPlainText: string,
    passwordHash: string,
  ): Promise<boolean> {
    const expectedHash = this.hashPlaintextPasswordSync(passwordPlainText);
    return Promise.resolve(passwordHash === expectedHash);
  }

  hashPlaintextPassword(passwordPlaintext: string): Promise<string> {
    const hash = this.hashPlaintextPasswordSync(passwordPlaintext);
    return Promise.resolve(hash);
  }

  private hashPlaintextPasswordSync(passwordPlaintext: string): string {
    return createHash("sha256").update(passwordPlaintext).digest("hex");
  }
}
