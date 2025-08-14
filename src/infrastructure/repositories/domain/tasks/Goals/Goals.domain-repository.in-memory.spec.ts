import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { goalMother } from "@test/domain/tasks/Goal.mother";

import { GoalsDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Goals/Goals.domain-repository.in-memory";

describe("GoalsDomainRepositoryInMemory", () => {
  describe("persist", () => {
    it("persists", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const goal = goalMother();
      await sut.persist(goal);

      await expect(sut.retrieve(goal.identity)).resolves.toBe(goal);
    });
  });
  describe("retrieve", () => {
    it("retrieves", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const goal = goalMother();
      await sut.persist(goal);

      await expect(sut.retrieve(goal.identity)).resolves.toBe(goal);
    });

    it("rejects when goal not found", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const nonExistentId = goalMother().identity;

      await expect(sut.retrieve(nonExistentId)).rejects.toThrow(
        "Goal not found",
      );
    });
  });
  describe("getOrderKey", () => {
    it("returns order key of goal", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const orderKey = "M";
      const goal = goalMother({ orderKey });
      await sut.persist(goal);
      await expect(sut.getOrderKey(goal.identity)).resolves.toBe(orderKey);
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("returns highest existing order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        goalMother({ orderKey: lower, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: higher, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: highest, assigned: assigned.identity }),
      );
      await expect(
        sut.searchForHighestOrderKey(assigned.identity),
      ).resolves.toBe(highest);
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("returns null if there is no entities", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(
        sut.searchForLowerOrderKey(goalMother().assigned, "M"),
      ).resolves.toBe(null);
    });
    it("returns null if there is no lower order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const orderKey = "M";
      const goal = goalMother({ orderKey });
      await sut.persist(goal);
      await expect(
        sut.searchForLowerOrderKey(goal.assigned, orderKey),
      ).resolves.toBe(null);
    });
    it("returns order key of the next goal with lower order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        goalMother({ orderKey: lower, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: higher, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: highest, assigned: assigned.identity }),
      );
      await expect(
        sut.searchForLowerOrderKey(assigned.identity, higher),
      ).resolves.toBe(lower);
      await expect(
        sut.searchForLowerOrderKey(assigned.identity, highest),
      ).resolves.toBe(higher);
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("returns null if there are no entities", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(
        sut.searchForLowestOrderKey(goalMother().assigned),
      ).resolves.toBe(null);
    });
    it("returns the lowest existing order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lowest = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        goalMother({ orderKey: higher, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: highest, assigned: assigned.identity }),
      );
      await sut.persist(
        goalMother({ orderKey: lowest, assigned: assigned.identity }),
      );
      await expect(
        sut.searchForLowestOrderKey(assigned.identity),
      ).resolves.toBe(lowest);
    });
  });
});
