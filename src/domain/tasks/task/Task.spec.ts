import { taskMother } from "@test/domain/tasks/Task.mother";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/Tasks/Tasks.domain-repository.in-memory";
import { OrderService } from "@domain/tasks/order";
import { plainToConfig } from "@infrastructure/config/configs/utility/plainToConfig";
import { OrderingConfig } from "@infrastructure/config/configs/ordering.config";
import { v4 } from "uuid";
import { IdentityValue } from "@domain/IdentityValue";

describe("Task", () => {
  it("can be moved before another one", async () => {
    const tasksRepository = new TasksDomainRepositoryInMemory();
    const orderingService = new OrderService(
      await plainToConfig({}, OrderingConfig),
      tasksRepository,
    );
    const exampleTasks = [v4(), v4()];
    for (const identity of exampleTasks) {
      const task = taskMother({
        identity: IdentityValue.fromString(identity),
        ordinalNumber: await orderingService.newOrdinalNumber(),
      });
      await tasksRepository.persist(task);
    }
    const createdTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(createdTasks[0].ordinalNumber).toBeGreaterThan(
      createdTasks[1].ordinalNumber,
    );

    await createdTasks[0].moveBefore(createdTasks[1].identity, orderingService);
    await tasksRepository.persist(createdTasks[0]);

    const updatedTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(updatedTasks[0].ordinalNumber).toBeLessThan(
      updatedTasks[1].ordinalNumber,
    );
  });
});
