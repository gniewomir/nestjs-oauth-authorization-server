import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { userMother } from "@test/domain/authentication";
import { assignedMother } from "@test/domain/tasks/Assigned.mother";
import { contextMother } from "@test/domain/tasks/Context.mother";

import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User/Users.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { Context as DomainContext } from "@domain/tasks/context/Context";
import { ContextsInterfaceSymbol } from "@domain/tasks/context/Contexts.interface";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { User as DatabaseUser } from "@infrastructure/database/entities";
import { Context as DatabaseContext } from "@infrastructure/database/entities/context.entity";
import {
  UserDomainRepository,
  UserDomainRepositoryModule,
} from "@infrastructure/repositories/domain/authentication/OAuth";
import { ContextsDomainRepositoryModule } from "@infrastructure/repositories/domain/tasks/Contexts/Contexts.domain-repository.module";

import { ContextsDomainRepository } from "./Contexts.domain-repository";

describe("ContextsDomainRepository", () => {
  let repository: ContextsDomainRepository;
  let module: TestingModule;
  let userDomainRepository: UserDomainRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([DatabaseContext, DatabaseUser]),
        ContextsDomainRepositoryModule,
        UserDomainRepositoryModule,
      ],
      providers: [ContextsDomainRepository],
    }).compile();

    repository = module.get<ContextsDomainRepository>(ContextsInterfaceSymbol);
    userDomainRepository =
      module.get<UserDomainRepository>(UsersInterfaceSymbol);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe("persist", () => {
    it("should save a new context to database", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const context = contextMother({
        assigned: assigned.identity,
        description: DescriptionValue.fromString("persist.test.context"),
      });

      await userDomainRepository.persist(user);

      // Act
      await repository.persist(context);

      // Assert - verify context was saved by retrieving it
      const savedContext = await repository.retrieve(context.identity);
      expect(savedContext).toBeInstanceOf(DomainContext);
      expect(savedContext.identity.toString()).toBe(
        context.identity.toString(),
      );
      expect(savedContext.description.toString()).toBe(
        context.description.toString(),
      );
      expect(savedContext.assigned.toString()).toBe(
        context.assigned.toString(),
      );
      expect(savedContext.orderKey).toBe(context.orderKey);
    });

    it("should update existing context when persisting with same identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const originalContext = contextMother({
        assigned: assigned.identity,
        description: DescriptionValue.fromString("original.description"),
        orderKey: "A",
      });

      await userDomainRepository.persist(user);
      await repository.persist(originalContext);

      // Act - create updated context with same identity
      const updatedContext = new DomainContext({
        identity: originalContext.identity, // Same identity
        description: DescriptionValue.fromString("updated.description"),
        assigned: originalContext.assigned,
        orderKey: "B", // Changed order key
      });
      await repository.persist(updatedContext);

      // Assert
      const retrievedContext = await repository.retrieve(
        originalContext.identity,
      );
      expect(retrievedContext.description.toString()).toBe(
        "updated.description",
      );
      expect(retrievedContext.orderKey).toBe("B");
      expect(retrievedContext.identity.toString()).toBe(
        originalContext.identity.toString(),
      );
      expect(retrievedContext.assigned.toString()).toBe(
        originalContext.assigned.toString(),
      );
    });
  });

  describe("retrieve", () => {
    it("should retrieve context by identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const context = contextMother({
        assigned: assigned.identity,
        description: DescriptionValue.fromString("retrieve.test.context"),
      });

      await userDomainRepository.persist(user);
      await repository.persist(context);

      // Act
      const result = await repository.retrieve(context.identity);

      // Assert
      expect(result).toBeInstanceOf(DomainContext);
      expect(result.identity.toString()).toBe(context.identity.toString());
      expect(result.description.toString()).toBe(
        context.description.toString(),
      );
      expect(result.assigned.toString()).toBe(context.assigned.toString());
      expect(result.orderKey).toBe(context.orderKey);
    });

    it("should throw error when context not found by identity", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.retrieve(nonExistentId)).rejects.toThrow(
        "Context not found",
      );
    });
  });

  describe("getOrderKey", () => {
    it("should return order key for existing context", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const orderKey = "getOrderKey.test.key";
      const context = contextMother({
        assigned: assigned.identity,
        orderKey,
      });

      await userDomainRepository.persist(user);
      await repository.persist(context);

      // Act
      const result = await repository.getOrderKey(context.identity);

      // Assert
      expect(result).toBe(orderKey);
    });

    it("should throw error when context not found", async () => {
      // Arrange
      const nonExistentId = IdentityValue.create();

      // Act & Assert
      await expect(repository.getOrderKey(nonExistentId)).rejects.toThrow(
        "Context not found",
      );
    });
  });

  describe("searchForLowerOrderKey", () => {
    it("should return null when no contexts exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        "M",
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return null when no lower order key exists", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const orderKey = "A"; // Lowest possible
      const context = contextMother({
        assigned: assigned.identity,
        orderKey,
      });

      await userDomainRepository.persist(user);
      await repository.persist(context);

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        orderKey,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return highest lower order key", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const lowerKey = "searchLower.a";
      const middleKey = "searchLower.m";
      const higherKey = "searchLower.z";

      await userDomainRepository.persist(user);

      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned.identity,
        higherKey,
      );

      // Assert
      expect(result).toBe(middleKey);
    });

    it("should only consider contexts for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);

      await repository.persist(
        contextMother({
          assigned: assigned1.identity,
          orderKey: "A",
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned2.identity,
          orderKey: "M",
        }),
      );

      // Act
      const result = await repository.searchForLowerOrderKey(
        assigned1.identity,
        "Z",
      );

      // Assert - should only find context from assigned1, not assigned2
      expect(result).toBe("A");
    });
  });

  describe("searchForHigherOrderKey", () => {
    it("should return null when no contexts exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        "M",
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return null when no higher order key exists", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const orderKey = "Z"; // Highest possible
      const context = contextMother({
        assigned: assigned.identity,
        orderKey,
      });

      await userDomainRepository.persist(user);
      await repository.persist(context);

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        orderKey,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return lowest higher order key", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const lowerKey = "searchHigher.a";
      const middleKey = "searchHigher.m";
      const higherKey = "searchHigher.z";

      await userDomainRepository.persist(user);

      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned.identity,
        lowerKey,
      );

      // Assert
      expect(result).toBe(middleKey);
    });

    it("should only consider contexts for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);

      await repository.persist(
        contextMother({
          assigned: assigned1.identity,
          orderKey: "M",
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned2.identity,
          orderKey: "Z",
        }),
      );

      // Act
      const result = await repository.searchForHigherOrderKey(
        assigned1.identity,
        "A",
      );

      // Assert - should only find context from assigned1, not assigned2
      expect(result).toBe("M");
    });
  });

  describe("searchForHighestOrderKey", () => {
    it("should return null when no contexts exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return highest order key for assigned identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const lowerKey = "searchHighest.a";
      const middleKey = "searchHighest.m";
      const highestKey = "searchHighest.z";

      await userDomainRepository.persist(user);

      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: lowerKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: highestKey,
        }),
      );

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(highestKey);
    });

    it("should only consider contexts for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);

      await repository.persist(
        contextMother({
          assigned: assigned1.identity,
          orderKey: "M",
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned2.identity,
          orderKey: "Z",
        }),
      );

      // Act
      const result = await repository.searchForHighestOrderKey(
        assigned1.identity,
      );

      // Assert - should only find context from assigned1, not assigned2
      expect(result).toBe("M");
    });
  });

  describe("searchForLowestOrderKey", () => {
    it("should return null when no contexts exist", async () => {
      // Arrange
      const assigned = assignedMother();

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(null);
    });

    it("should return lowest order key for assigned identity", async () => {
      // Arrange
      const user = userMother();
      const assigned = assignedMother({ identity: user.identity });
      const lowestKey = "searchLowest.a";
      const middleKey = "searchLowest.m";
      const higherKey = "searchLowest.z";

      await userDomainRepository.persist(user);

      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: middleKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: higherKey,
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned.identity,
          orderKey: lowestKey,
        }),
      );

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned.identity,
      );

      // Assert
      expect(result).toBe(lowestKey);
    });

    it("should only consider contexts for the specified assigned identity", async () => {
      // Arrange
      const user1 = userMother();
      const assigned1 = assignedMother({ identity: user1.identity });
      const user2 = userMother();
      const assigned2 = assignedMother({ identity: user2.identity });

      await userDomainRepository.persist(user1);
      await userDomainRepository.persist(user2);

      await repository.persist(
        contextMother({
          assigned: assigned1.identity,
          orderKey: "M",
        }),
      );
      await repository.persist(
        contextMother({
          assigned: assigned2.identity,
          orderKey: "A",
        }),
      );

      // Act
      const result = await repository.searchForLowestOrderKey(
        assigned1.identity,
      );

      // Assert - should only find context from assigned1, not assigned2
      expect(result).toBe("M");
    });
  });
});
