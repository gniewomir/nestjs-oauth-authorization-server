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
  describe("getOrdinalNumber", () => {
    it("returns ordinal number of entity", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const context = contextMother({ ordinalNumber });
      await sut.persist(context);
      await expect(sut.getOrdinalNumber(context.identity)).resolves.toBe(
        ordinalNumber,
      );
    });
  });

  describe("searchForLowestOrdinalNumber", () => {
    it("returns lowest existing ordinal number", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const lowestOrdinalNumber = 42;
      const higherOrdinalNumber = lowestOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(contextMother({ ordinalNumber: lowestOrdinalNumber }));
      await sut.persist(contextMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(contextMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(sut.searchForLowestOrdinalNumber()).resolves.toBe(
        lowestOrdinalNumber,
      );
    });
  });

  describe("searchForLowerOrdinalNumber", () => {
    it("returns null if there is no entities", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      await expect(sut.searchForLowerOrdinalNumber(1)).resolves.toBe(null);
    });
    it("returns null if there is no lower positive ordinal number", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const ordinalNumber = 42;
      const context = contextMother({ ordinalNumber });
      await sut.persist(context);
      await expect(
        sut.searchForLowerOrdinalNumber(ordinalNumber),
      ).resolves.toBe(null);
    });
    it("returns ordinal number of the next entity with lower ordinal number", async () => {
      const sut = new ContextsDomainRepositoryInMemory();
      const lowerOrdinalNumber = 42;
      const higherOrdinalNumber = lowerOrdinalNumber * 2;
      const highestOrdinalNumber = higherOrdinalNumber * 2;
      await sut.persist(contextMother({ ordinalNumber: lowerOrdinalNumber }));
      await sut.persist(contextMother({ ordinalNumber: higherOrdinalNumber }));
      await sut.persist(contextMother({ ordinalNumber: highestOrdinalNumber }));
      await expect(
        sut.searchForLowerOrdinalNumber(higherOrdinalNumber),
      ).resolves.toBe(lowerOrdinalNumber);
      await expect(
        sut.searchForLowerOrdinalNumber(highestOrdinalNumber),
      ).resolves.toBe(higherOrdinalNumber);
    });
  });
});
