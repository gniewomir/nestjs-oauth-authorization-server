import { userMother } from "./User.mother";
import { User } from "@domain/authentication/OAuth/User/User";

describe("User.mothers", () => {
  it("has working mother", () => {
    expect(userMother()).toBeInstanceOf(User);
  });
});
