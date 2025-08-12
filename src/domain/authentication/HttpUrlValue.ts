import { Assert } from "@domain/Assert";

export class HttpUrlValue {
  private readonly parsedUrl: URL;

  private constructor(url: string) {
    const parsedUrl = new URL(url);
    Assert(["http:", "https:"].includes(parsedUrl.protocol), "");
    this.parsedUrl = parsedUrl;
  }

  public static fromString(url: string): HttpUrlValue {
    return new HttpUrlValue(url);
  }

  public toString(): string {
    return this.parsedUrl.toString();
  }

  public isEqual(httpUrlValue: HttpUrlValue): boolean {
    return this.toString() === httpUrlValue.toString();
  }
}
