import { taskMother } from "@test/domain/tasks/Task.mother";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/Tasks/Tasks.domain-repository.in-memory";

describe("TasksDomainRepositoryInMemory", () => {
  describe("persist", () => {
    it("persists", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const task = taskMother();
      await sut.persist(task);

      await expect(sut.retrieve(task.identity)).resolves.toBe(task);
    });
  });
  describe("retrieve", () => {
    it("retrieves", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const task = taskMother();
      await sut.persist(task);

      await expect(sut.retrieve(task.identity)).resolves.toBe(task);
    });
  });
  describe("getOrdinalNumber", () => {
    it("returns ordinal number of task", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const task = taskMother({ ordinalNumber });
      await sut.persist(task);
      await expect(sut.getOrdinalNumber(task.identity)).resolves.toBe(
        ordinalNumber,
      );
    });
  });

  describe("searchForLowestOrdinalNumber", () => {
    it("returns lowest existing ordinal number", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const lowestOrdinalNumber = 42;
      const higherOrdinalNumber = lowestOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(taskMother({ ordinalNumber: lowestOrdinalNumber }));
      await sut.persist(taskMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(taskMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(sut.searchForLowestOrdinalNumber()).resolves.toBe(
        lowestOrdinalNumber,
      );
    });
  });

  describe("searchForLowerOrdinalNumber", () => {
    it("returns null if there is no tasks", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      await expect(sut.searchForLowerOrdinalNumber(1)).resolves.toBe(null);
    });
    it("returns null if there is no lower positive ordinal number", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const task = taskMother({ ordinalNumber });
      await sut.persist(task);
      await expect(
        sut.searchForLowerOrdinalNumber(ordinalNumber),
      ).resolves.toBe(null);
    });
    it("returns ordinal number of the next task with lower ordinal number", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const lowerOrdinalNumber = 42;
      const higherOrdinalNumber = lowerOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(taskMother({ ordinalNumber: lowerOrdinalNumber }));
      await sut.persist(taskMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(taskMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(
        sut.searchForLowerOrdinalNumber(higherOrdinalNumber),
      ).resolves.toBe(lowerOrdinalNumber);
      await expect(
        sut.searchForLowerOrdinalNumber(highestOrdinalNumber),
      ).resolves.toBe(higherOrdinalNumber);
    });
  });
});
