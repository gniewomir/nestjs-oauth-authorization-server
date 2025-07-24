import { Goal } from "./goal/Goal";
import { Context } from "./context/Context";
import { IdentityValue } from "../IdentityValue";
import { DescriptionValue } from "./DescriptionValue";
import { Assigned } from "./assigned/Assigned";

export class Task {
  constructor(
    public readonly identity: IdentityValue,
    public readonly description: DescriptionValue,
    public readonly assigned: Assigned,
    public readonly goal: Goal,
    public readonly context: Context,
  ) {}
}
