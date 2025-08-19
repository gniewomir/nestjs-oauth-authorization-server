import { Assert } from "@domain/Assert";

export class RedirectUriValue {
  private readonly parsedUrl: URL;

  private constructor(url: URL) {
    Assert(
      ["http:", "https:"].includes(url.protocol),
      "Only http/https protocols are allowed.",
    );
    Assert(url.search === "", "Query string parameters are not allowed");
    Assert(url.hash === "", "Hash is not allowed");
    this.parsedUrl = url;
  }

  public static create(
    uri: string,
    env: "production" | "test" | "development",
  ): RedirectUriValue {
    const parsedUrl = new URL(uri);
    Assert(
      env === "production"
        ? parsedUrl.protocol === "https:"
        : ["https:", "http:"].includes(parsedUrl.protocol),
      "Only secure redirects are allowed on production",
    );
    return new RedirectUriValue(parsedUrl);
  }

  public static fromString(uri: string): RedirectUriValue {
    return new RedirectUriValue(new URL(uri));
  }

  public toURL(): URL {
    return new URL(this.parsedUrl.toString());
  }

  public toString(): string {
    return this.parsedUrl.toString();
  }

  public isEqual(redirectUriValue: RedirectUriValue): boolean {
    return this.toString() === redirectUriValue.toString();
  }
}
