import { assignedMother } from "@test/domain/tasks/Assigned.mother";

import { AssignedDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Assigned/Assigned.domain-repository.in-memory";

describe("AssignedDomainRepositoryInMemory", () => {
  describe("persist + retrieve", () => {
    it("persists and retrieves", async () => {
      const sut = new AssignedDomainRepositoryInMemory();
      const assigned = assignedMother();
      await sut.persist(assigned);

      await expect(sut.retrieve(assigned.identity)).resolves.toBe(assigned);
    });
  });

  describe("retrieve", () => {
    it("rejects when not found", async () => {
      const sut = new AssignedDomainRepositoryInMemory();
      const nonExistent = assignedMother();

      await expect(sut.retrieve(nonExistent.identity)).rejects.toThrow(
        "Assigned not found",
      );
    });
  });
});
