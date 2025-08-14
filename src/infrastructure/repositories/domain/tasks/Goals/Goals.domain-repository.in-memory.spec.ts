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
  describe("getOrdinalNumber", () => {
    it("returns ordinal number of goal", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const goal = goalMother({ ordinalNumber });
      await sut.persist(goal);
      await expect(sut.getOrdinalNumber(goal.identity)).resolves.toBe(
        ordinalNumber,
      );
    });
  });

  describe("searchForLowestOrdinalNumber", () => {
    it("returns lowest existing ordinal number", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const lowestOrdinalNumber = 42;
      const higherOrdinalNumber = lowestOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(goalMother({ ordinalNumber: lowestOrdinalNumber }));
      await sut.persist(goalMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(goalMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(sut.searchForLowestOrdinalNumber()).resolves.toBe(
        lowestOrdinalNumber,
      );
    });
  });

  describe("searchForLowerOrdinalNumber", () => {
    it("returns null if there is no entities", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      await expect(sut.searchForLowerOrdinalNumber(1)).resolves.toBe(null);
    });
    it("returns null if there is no lower positive ordinal number", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const goal = goalMother({ ordinalNumber });
      await sut.persist(goal);
      await expect(
        sut.searchForLowerOrdinalNumber(ordinalNumber),
      ).resolves.toBe(null);
    });
    it("returns ordinal number of the next goal with lower ordinal number", async () => {
      const sut = new GoalsDomainRepositoryInMemory();
      const lowerOrdinalNumber = 42;
      const higherOrdinalNumber = lowerOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(goalMother({ ordinalNumber: lowerOrdinalNumber }));
      await sut.persist(goalMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(goalMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(
        sut.searchForLowerOrdinalNumber(higherOrdinalNumber),
      ).resolves.toBe(lowerOrdinalNumber);
      await expect(
        sut.searchForLowerOrdinalNumber(highestOrdinalNumber),
      ).resolves.toBe(higherOrdinalNumber);
    });
  });
});
