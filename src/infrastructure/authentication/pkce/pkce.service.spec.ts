import { PKCEService } from "@infrastructure/authentication/pkce/pkce.service";
import { PKCEServiceFake } from "@infrastructure/authentication/pkce/pkce.service.fake";

describe("PKCEService", () => {
  it("is able to positively verify codeChallenge with codeVerifier", () => {
    const sut = new PKCEService();
    const fake = new PKCEServiceFake();
    const codeVerifier = fake.generateCodeVerifier();
    const codeChallenge = fake.generateChallenge(codeVerifier);
    expect(
      sut.verify({
        codeVerifier,
        codeChallenge,
      }),
    ).toEqual(true);
  });
  it("is able to negatively verify codeChallenge with codeVerifier", () => {
    const sut = new PKCEService();
    const fake = new PKCEServiceFake();
    const codeVerifier = fake.generateCodeVerifier();
    const codeChallenge = fake.generateChallenge(fake.generateCodeVerifier());
    expect(
      sut.verify({
        codeVerifier,
        codeChallenge,
      }),
    ).toEqual(false);
  });
});
