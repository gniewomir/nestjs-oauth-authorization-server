import { OrderService } from "@domain/tasks/order/Order.service";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Tasks/Tasks.domain-repository.in-memory";
import { taskMother } from "@test/domain/tasks/Task.mother";
import { OrderingConfig } from "@infrastructure/config/configs/ordering.config";
import { plainToConfig } from "@infrastructure/config/configs/utility/plainToConfig";

describe("OrderService", () => {
  describe("newOrdinalNumber", () => {
    it("returns half of greatest safe integer if there is no tasks", async () => {
      const maxOrdinalNumber = Number.MAX_SAFE_INTEGER;
      const halfOfMaxOrdinalNumber = Math.floor(maxOrdinalNumber / 2);
      const maxEntitiesPerAssigned = 100_000;
      const ordinalNumbersSpacing = Math.floor(
        maxOrdinalNumber / maxEntitiesPerAssigned,
      );
      const sut = new OrderService(
        await plainToConfig(
          {
            maxOrdinalNumber,
            maxEntitiesPerAssigned,
            ordinalNumbersSpacing,
          },
          OrderingConfig,
        ),
        new TasksDomainRepositoryInMemory(),
      );
      await expect(sut.newOrdinalNumber()).resolves.toEqual(
        halfOfMaxOrdinalNumber,
      );
    });
    it("returns lowest task ordinal number minus ordinal number spacing", async () => {
      const maxOrdinalNumber = Number.MAX_SAFE_INTEGER;
      const maxEntitiesPerAssigned = 100_000;
      const ordinalNumbersSpacing = Math.floor(
        maxOrdinalNumber / maxEntitiesPerAssigned,
      );
      const tasks = new TasksDomainRepositoryInMemory();
      await tasks.persist(taskMother({ ordinalNumber: maxOrdinalNumber }));
      const sut = new OrderService(
        await plainToConfig(
          {
            maxOrdinalNumber,
            maxEntitiesPerAssigned,
            ordinalNumbersSpacing,
          },
          OrderingConfig,
        ),
        tasks,
      );
      await expect(sut.newOrdinalNumber()).resolves.toEqual(
        maxOrdinalNumber - ordinalNumbersSpacing,
      );
    });
  });
  describe("nextAvailableOrdinalNumber", () => {
    it("finds ordinal number between two entities", async () => {
      const maxOrdinalNumber = 100;
      const maxEntitiesPerAssigned = 10;
      const ordinalNumbersSpacing = Math.floor(
        maxOrdinalNumber / maxEntitiesPerAssigned,
      );
      const tasks = new TasksDomainRepositoryInMemory();
      const sut = new OrderService(
        await plainToConfig(
          {
            maxOrdinalNumber,
            maxEntitiesPerAssigned,
            ordinalNumbersSpacing,
          },
          OrderingConfig,
        ),
        tasks,
      );
      const firstTask = taskMother({ ordinalNumber: 100 });
      const secondTask = taskMother({ ordinalNumber: 90 });
      const thirdTask = taskMother({ ordinalNumber: 80 });

      await tasks.persist(firstTask);
      await tasks.persist(secondTask);
      await tasks.persist(thirdTask);

      await expect(
        sut.nextAvailableOrdinalNumber(firstTask.identity),
      ).resolves.toBe(95);
      await expect(
        sut.nextAvailableOrdinalNumber(secondTask.identity),
      ).resolves.toBe(85);
      await expect(
        sut.nextAvailableOrdinalNumber(thirdTask.identity),
      ).resolves.toBe(70);
    });

    it("finds next ordinal number according to ordinal number spacing, if there is no entity with lower ordinal number", async () => {
      const maxOrdinalNumber = 100;
      const maxEntitiesPerAssigned = 10;
      const ordinalNumbersSpacing = Math.floor(
        maxOrdinalNumber / maxEntitiesPerAssigned,
      );
      const tasks = new TasksDomainRepositoryInMemory();
      const sut = new OrderService(
        await plainToConfig(
          {
            maxOrdinalNumber,
            maxEntitiesPerAssigned,
            ordinalNumbersSpacing,
          },
          OrderingConfig,
        ),
        tasks,
      );
      const firstTask = taskMother({ ordinalNumber: 100 });
      const secondTask = taskMother({ ordinalNumber: 90 });
      const thirdTask = taskMother({ ordinalNumber: 80 });

      await tasks.persist(firstTask);
      await tasks.persist(secondTask);
      await tasks.persist(thirdTask);

      await expect(
        sut.nextAvailableOrdinalNumber(thirdTask.identity),
      ).resolves.toBe(70);
    });
  });
});
