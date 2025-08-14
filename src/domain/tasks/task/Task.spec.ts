import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { taskMother } from "@test/domain/tasks/Task.mother";
import { v4 } from "uuid";

import { IdentityValue } from "@domain/IdentityValue";
import { OrderService } from "@domain/tasks/order";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Tasks/Tasks.domain-repository.in-memory";

describe("Task", () => {
  it("can be moved before another one", async () => {
    const tasksRepository = new TasksDomainRepositoryInMemory();
    const orderingService = new OrderService(tasksRepository);
    const assigned = assignedMother({ identity: IdentityValue.create() });
    const exampleTasks = [v4(), v4()];
    for (const identity of exampleTasks) {
      const task = taskMother({
        identity: IdentityValue.fromString(identity),
        assigned: assigned.identity,
        orderKey: await orderingService.newOrderKey(assigned.identity),
      });
      await tasksRepository.persist(task);
    }
    const createdTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(createdTasks[0].orderKey < createdTasks[1].orderKey).toBe(true);

    await createdTasks[0].moveBefore(createdTasks[1].identity, orderingService);
    await tasksRepository.persist(createdTasks[0]);

    const updatedTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(updatedTasks[0].orderKey < updatedTasks[1].orderKey).toBe(true);
  });

  it("can be moved after another one", async () => {
    const tasksRepository = new TasksDomainRepositoryInMemory();
    const orderingService = new OrderService(tasksRepository);
    const assigned = assignedMother({ identity: IdentityValue.create() });
    const exampleTasks = [v4(), v4()];
    for (const identity of exampleTasks) {
      const task = taskMother({
        identity: IdentityValue.fromString(identity),
        assigned: assigned.identity,
        orderKey: await orderingService.newOrderKey(assigned.identity),
      });
      await tasksRepository.persist(task);
    }
    const createdTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(createdTasks[0].orderKey < createdTasks[1].orderKey).toBe(true);

    await createdTasks[0].moveAfter(createdTasks[1].identity, orderingService);
    await tasksRepository.persist(createdTasks[0]);

    const updatedTasks = await Promise.all(
      exampleTasks.map(async (identity) =>
        tasksRepository.retrieve(IdentityValue.fromString(identity)),
      ),
    );

    expect(updatedTasks[0].orderKey > updatedTasks[1].orderKey).toBe(true);
  });
});
