import { IdentityValue } from "../../IdentityValue";

export type TAssignedConstructorArgs = ConstructorParameters<typeof Assigned>;
export type TAssignedConstructorParam = TAssignedConstructorArgs[0];

export class Assigned {
  public readonly identity: IdentityValue;

  constructor(parameters: { identity: IdentityValue }) {
    this.identity = parameters.identity;
  }
}
