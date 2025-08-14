import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { taskMother } from "@test/domain/tasks/Task.mother";

import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Tasks/Tasks.domain-repository.in-memory";

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

    it("rejects when task not found", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const nonExistentId = taskMother().identity;

      await expect(sut.retrieve(nonExistentId)).rejects.toThrow(
        "Task not found",
      );
    });
  });
  describe("getOrdinalNumber", () => {
    it("returns order key of task", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const orderKey = "M";
      const task = taskMother({ orderKey });
      await sut.persist(task);
      await expect(sut.getOrderKey(task.identity)).resolves.toBe(orderKey);
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("returns highest existing order key", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        taskMother({
          orderKey: lower,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: higher,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: highest,
          assigned: assigned.identity,
        }),
      );
      await expect(
        sut.searchForHighestOrderKey(assigned.identity),
      ).resolves.toBe(highest);
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("returns null if there is no tasks", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      await expect(
        sut.searchForLowerOrderKey(taskMother().assigned, "M"),
      ).resolves.toBe(null);
    });
    it("returns null if there is no lower order key", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const orderKey = "M";
      const assigned = assignedMother();
      const task = taskMother({
        orderKey,
        assigned: assigned.identity,
      });
      await sut.persist(task);
      await expect(
        sut.searchForLowerOrderKey(assigned.identity, orderKey),
      ).resolves.toBe(null);
    });
    it("returns order key of the next task with lower order key", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        taskMother({
          orderKey: lower,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: higher,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: highest,
          assigned: assigned.identity,
        }),
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
    it("returns null if there are no tasks", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      await expect(
        sut.searchForLowestOrderKey(taskMother().assigned),
      ).resolves.toBe(null);
    });
    it("returns the lowest existing order key", async () => {
      const sut = new TasksDomainRepositoryInMemory();
      const assigned = assignedMother();
      const lowest = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(
        taskMother({
          orderKey: higher,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: highest,
          assigned: assigned.identity,
        }),
      );
      await sut.persist(
        taskMother({
          orderKey: lowest,
          assigned: assigned.identity,
        }),
      );
      await expect(
        sut.searchForLowestOrderKey(assigned.identity),
      ).resolves.toBe(lowest);
    });
  });
});
