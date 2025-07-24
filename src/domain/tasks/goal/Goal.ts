import { IdentityValue } from "../../IdentityValue";
import { DescriptionValue } from "../DescriptionValue";

export class Goal {
  constructor(
    public readonly identity: IdentityValue,
    public readonly description: DescriptionValue,
  ) {}
}
