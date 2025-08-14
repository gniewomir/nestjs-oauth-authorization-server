import { User } from "@domain/authentication/OAuth/User/User";

import { userMother } from "./User.mother";

describe("User.mothers", () => {
  it("has working mother", () => {
    expect(userMother()).toBeInstanceOf(User);
  });
});
