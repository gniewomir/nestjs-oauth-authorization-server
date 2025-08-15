import { Assert } from "@domain/Assert";
import { DescriptionInterface } from "@domain/tasks/Description.interface";

export class DescriptionValue {
  private constructor(private readonly text: string) {
    Assert(text.length > 0, "Description cannot be empty");
  }

  public static fromInsecureSource(
    text: string,
    sanitizer: DescriptionInterface,
  ): DescriptionValue {
    return DescriptionValue.fromString(sanitizer.sanitize(text));
  }

  public static fromString(text: string): DescriptionValue {
    return new DescriptionValue(text);
  }

  public toString() {
    return this.text;
  }
}
