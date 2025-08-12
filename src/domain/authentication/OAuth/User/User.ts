import { IdentityValue } from "@domain/IdentityValue";
import { Token } from "@domain/authentication/OAuth/User/Token/Token";
import { EmailValue } from "@domain/authentication/OAuth/Credentials/EmailValue";

export type TUserConstructorArgs = ConstructorParameters<typeof User>;
export type TUserConstructorParam = TUserConstructorArgs[0];

export class User {
  public readonly identity: IdentityValue;
  public readonly email: EmailValue;
  public readonly emailVerified: boolean;
  public readonly hashedPassword: string;
  public readonly tokens: Token[];

  constructor(parameters: {
    identity: IdentityValue;
    email: EmailValue;
    emailVerified: boolean;
    hashedPassword: string;
    tokens: Token[];
  }) {
    this.identity = parameters.identity;
    this.email = parameters.email;
    this.emailVerified = parameters.emailVerified;
    this.hashedPassword = parameters.hashedPassword;
  }
}
