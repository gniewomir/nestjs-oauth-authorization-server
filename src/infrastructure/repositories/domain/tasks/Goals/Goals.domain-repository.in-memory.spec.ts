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
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(goalMother({ orderKey: lower }));
      await sut.persist(goalMother({ orderKey: higher }));
      await sut.persist(goalMother({ orderKey: highest }));
      await expect(sut.searchForHighestOrderKey()).resolves.toBe(highest);
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("returns null if there is no entities", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(sut.searchForLowerOrderKey("M")).resolves.toBe(null);
    });
    it("returns null if there is no lower order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const orderKey = "M";
      const goal = goalMother({ orderKey });
      await sut.persist(goal);
      await expect(sut.searchForLowerOrderKey(orderKey)).resolves.toBe(null);
    });
    it("returns order key of the next goal with lower order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(goalMother({ orderKey: lower }));
      await sut.persist(goalMother({ orderKey: higher }));
      await sut.persist(goalMother({ orderKey: highest }));
      await expect(sut.searchForLowerOrderKey(higher)).resolves.toBe(lower);
      await expect(sut.searchForLowerOrderKey(highest)).resolves.toBe(higher);
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("returns null if there are no entities", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(sut.searchForLowestOrderKey()).resolves.toBe(null);
    });
    it("returns the lowest existing order key", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const lowest = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(goalMother({ orderKey: higher }));
      await sut.persist(goalMother({ orderKey: highest }));
      await sut.persist(goalMother({ orderKey: lowest }));
      await expect(sut.searchForLowestOrderKey()).resolves.toBe(lowest);
    });
  });
});
