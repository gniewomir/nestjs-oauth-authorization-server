import { Request } from "@domain/authentication/OAuth/Authorization/Request";

import { requestMother } from "./Request.mother";

describe("Request.mothers", () => {
  it("has working mother", () => {
    expect(requestMother()).toBeInstanceOf(Request);
  });
});
