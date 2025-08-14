import { clientMother } from "./Client.mother";
import { Client } from "@domain/authentication/OAuth/Client/Client";

describe("Client.mothers", () => {
  it("has working mother", () => {
    expect(clientMother()).toBeInstanceOf(Client);
  });
});
