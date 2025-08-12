export interface PasswordInterface {
  comparePlaintextAndHashedPassword(
    passwordPlainText: string,
    passwordHash: string,
  ): Promise<boolean>;

  hashPlaintextPassword(passwordPlainText: string): Promise<string>;
}

export const PasswordInterfaceSymbol = Symbol.for("PasswordInterface");
