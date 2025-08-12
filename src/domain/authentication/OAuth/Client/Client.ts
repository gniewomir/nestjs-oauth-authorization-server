import { IdentityValue } from "@domain/IdentityValue";

export type TClientConstructorArgs = ConstructorParameters<typeof Client>;
export type TClientConstructorParam = TClientConstructorArgs[0];

export class Client {
  public readonly id: IdentityValue;
  public readonly name: string;

  constructor(params: { id: IdentityValue; name: string }) {
    this.id = params.id;
    this.name = params.name;
  }
}
