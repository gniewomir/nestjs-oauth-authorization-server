import * as assert from "assert";

export class DescriptionValue {
  private constructor(private readonly text: string) {
    assert(text.length, "Description cannot be empty");
  }

  public static fromString(text: string): DescriptionValue {
    return new DescriptionValue(text);
  }

  public toString() {
    return this.text;
  }
}
