import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { goalMother } from "@test/domain/tasks/Goal.mother";

import { GoalsDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Goals/Goals.domain-repository.in-memory";

describe("GoalsDomainRepositoryInMemory", () => {
  describe("persist", () => {
    it("should save a goal to memory", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const goal = goalMother();
      await sut.persist(goal);

      await expect(sut.retrieve(goal.identity)).resolves.toBe(goal);
    });
  });
  describe("retrieve", () => {
    it("should return goal when found by identity", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const goal = goalMother();
      await sut.persist(goal);

      await expect(sut.retrieve(goal.identity)).resolves.toBe(goal);
    });

    it("should throw error when goal not found by identity", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const nonExistentId = goalMother().identity;

      await expect(sut.retrieve(nonExistentId)).rejects.toThrow(
        "Goal not found",
      );
    });
  });
  describe("getOrderKey", () => {
    it("should return order key when goal found by identity", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const orderKey = "M";
      const goal = goalMother({ orderKey });
      await sut.persist(goal);
      await expect(sut.getOrderKey(goal.identity)).resolves.toBe(orderKey);
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("should return highest order key when goals exist for user", async () => {
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
    it("should return null when no goals exist for user", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(
        sut.searchForLowerOrderKey(goalMother().assigned, "M"),
      ).resolves.toBe(null);
    });
    it("should return null when no lower order key exists", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const orderKey = "M";
      const goal = goalMother({ orderKey });
      await sut.persist(goal);
      await expect(
        sut.searchForLowerOrderKey(goal.assigned, orderKey),
      ).resolves.toBe(null);
    });
    it("should return order key of goal with next lower order key", async () => {
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
    it("should return null when no goals exist for user", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(
        sut.searchForLowestOrderKey(goalMother().assigned),
      ).resolves.toBe(null);
    });
    it("should return lowest order key when goals exist for user", async () => {
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
