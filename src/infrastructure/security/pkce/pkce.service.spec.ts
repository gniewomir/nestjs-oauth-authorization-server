import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { PKCEService } from "@infrastructure/security/pkce/pkce.service";
import { PKCEServiceFake } from "@infrastructure/security/pkce/pkce.service.fake";

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
        method: CodeChallengeMethodValue.METHOD_S256(),
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
        method: CodeChallengeMethodValue.METHOD_S256(),
      }),
    ).toEqual(false);
  });
});
