import { Request } from "@domain/auth/OAuth/Authorization/Request";

import { requestMother } from "./Request.mother";

describe("Request.mothers", () => {
  it("has working mother", () => {
    expect(requestMother()).toBeInstanceOf(Request);
  });
});
