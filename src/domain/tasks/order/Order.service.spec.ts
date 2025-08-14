import { taskMother } from "@test/domain/tasks/Task.mother";

import { OrderService } from "@domain/tasks/order/Order.service";
import { TasksDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Tasks/Tasks.domain-repository.in-memory";

describe("OrderService", () => {
  describe("between", () => {
    it("returns a key strictly between two given keys", () => {
      const sut = new OrderService(new TasksDomainRepositoryInMemory());
      const mid = sut.between("A", "C");
      expect(mid > "A" && mid < "C").toBe(true);
    });
    it("creates space by extending length when needed", () => {
      const sut = new OrderService(new TasksDomainRepositoryInMemory());
      const a = "A";
      const b = "A";
      const mid = sut.between(a, b);
      expect(mid.startsWith("A")).toBe(true);
      expect(mid.length).toBeGreaterThan(a.length);
    });
  });

  describe("newOrderKey and nextAvailableOrderKey", () => {
    it("generates monotonic keys for inserts at end and between neighbors", async () => {
      const repo = new TasksDomainRepositoryInMemory();
      const sut = new OrderService(repo);

      const a = taskMother({ orderKey: await sut.newOrderKey() });
      await repo.persist(a);

      const b = taskMother({ orderKey: await sut.newOrderKey() });
      await repo.persist(b);

      expect(a.orderKey < b.orderKey).toBe(true);

      const c = taskMother({
        orderKey: await sut.nextAvailableOrderKeyBefore(b.identity),
      });
      await repo.persist(c);

      expect(a.orderKey < c.orderKey && c.orderKey < b.orderKey).toBe(true);
    });
  });

  describe("nextAvailableOrderKeyAfter", () => {
    it("generates key after reference when higher neighbor exists", async () => {
      const repo = new TasksDomainRepositoryInMemory();
      const sut = new OrderService(repo);

      const a = taskMother({ orderKey: await sut.newOrderKey() });
      await repo.persist(a);
      const b = taskMother({ orderKey: await sut.newOrderKey() });
      await repo.persist(b);

      const key = await sut.nextAvailableOrderKeyAfter(a.identity);
      expect(key > a.orderKey && key < b.orderKey).toBe(true);
    });

    it("generates key after reference when it is the last element", async () => {
      const repo = new TasksDomainRepositoryInMemory();
      const sut = new OrderService(repo);

      const a = taskMother({ orderKey: await sut.newOrderKey() });
      await repo.persist(a);

      const key = await sut.nextAvailableOrderKeyAfter(a.identity);
      expect(key > a.orderKey).toBe(true);
    });
  });
});
