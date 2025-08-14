import { requestMother } from "./Request.mother";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";

describe("Request.mothers", () => {
  it("has working mother", () => {
    expect(requestMother()).toBeInstanceOf(Request);
  });
});
