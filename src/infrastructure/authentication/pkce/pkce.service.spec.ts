import { PKCEService } from "@infrastructure/authentication/pkce/pkce.service";
import { createHash, getRandomValues } from "crypto";

const generateCodeVerifier = () => {
  const randomBytes = getRandomValues(new Uint8Array(32));
  return Buffer.from(randomBytes).toString("base64");
};

const generateChallenge = (codeVerifier: string) => {
  return createHash("sha256").update(codeVerifier).digest("base64");
};

describe("PKCEService", () => {
  it("is able to positively verify codeChallenge with codeVerifier", () => {
    const sut = new PKCEService();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateChallenge(codeVerifier);
    expect(
      sut.verify({
        codeVerifier,
        codeChallenge,
      }),
    ).toEqual(true);
  });
  it("is able to negatively verify codeChallenge with codeVerifier", () => {
    const sut = new PKCEService();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateChallenge(generateCodeVerifier());
    expect(
      sut.verify({
        codeVerifier,
        codeChallenge,
      }),
    ).toEqual(false);
  });
});
