import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";

export class Context {
  constructor(
    public readonly identity: IdentityValue,
    public readonly description: DescriptionValue,
  ) {}
}
