import { Assert } from "@domain/Assert";

export class DescriptionValue {
  private constructor(private readonly text: string) {
    Assert(text.length > 0, "Description cannot be empty");
  }

  public static fromString(text: string): DescriptionValue {
    return new DescriptionValue(text);
  }

  public toString() {
    return this.text;
  }
}
