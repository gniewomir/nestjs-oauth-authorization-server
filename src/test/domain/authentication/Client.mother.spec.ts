import { Client } from "@domain/auth/OAuth/Client/Client";

import { clientMother } from "./Client.mother";

describe("Client.mothers", () => {
  it("has working mother", () => {
    expect(clientMother()).toBeInstanceOf(Client);
  });
});
