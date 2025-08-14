import { contextMother } from "@test/domain/tasks/Context.mother";

import { ContextsDomainRepositoryInMemory } from "@infrastructure/repositories/domain/tasks/Contexts/Contexts.domain-repository.in-memory";

describe("ContextsDomainRepositoryInMemory", () => {
  describe("persist", () => {
    it("persists", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const context = contextMother();
      await sut.persist(context);

      await expect(sut.retrieve(context.identity)).resolves.toBe(context);
    });
  });
  describe("retrieve", () => {
    it("retrieves", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const context = contextMother();
      await sut.persist(context);

      await expect(sut.retrieve(context.identity)).resolves.toBe(context);
    });

    it("rejects when context not found", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const nonExistentId = contextMother().identity;

      await expect(sut.retrieve(nonExistentId)).rejects.toThrow(
        "Context not found",
      );
    });
  });
  describe("getOrderKey", () => {
    it("returns order key of entity", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const orderKey = "M";
      const context = contextMother({ orderKey });
      await sut.persist(context);
      await expect(sut.getOrderKey(context.identity)).resolves.toBe(orderKey);
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("returns highest existing order key", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(contextMother({ orderKey: lower }));
      await sut.persist(contextMother({ orderKey: higher }));
      await sut.persist(contextMother({ orderKey: highest }));
      await expect(sut.searchForHighestOrderKey()).resolves.toBe(highest);
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("returns null if there is no entities", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      await expect(sut.searchForLowerOrderKey("M")).resolves.toBe(null);
    });
    it("returns null if there is no lower order key", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const orderKey = "M";
      const context = contextMother({ orderKey });
      await sut.persist(context);
      await expect(sut.searchForLowerOrderKey(orderKey)).resolves.toBe(null);
    });
    it("returns order key of the next entity with lower order key", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const lower = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(contextMother({ orderKey: lower }));
      await sut.persist(contextMother({ orderKey: higher }));
      await sut.persist(contextMother({ orderKey: highest }));
      await expect(sut.searchForLowerOrderKey(higher)).resolves.toBe(lower);
      await expect(sut.searchForLowerOrderKey(highest)).resolves.toBe(higher);
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("returns null if there are no entities", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      await expect(sut.searchForLowestOrderKey()).resolves.toBe(null);
    });
    it("returns the lowest existing order key", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const lowest = "A";
      const higher = "M";
      const highest = "z";
      await sut.persist(contextMother({ orderKey: higher }));
      await sut.persist(contextMother({ orderKey: highest }));
      await sut.persist(contextMother({ orderKey: lowest }));
      await expect(sut.searchForLowestOrderKey()).resolves.toBe(lowest);
    });
  });
});
