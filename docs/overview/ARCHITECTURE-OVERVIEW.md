# Architecture Overview

## Introduction

This codebase implements a **Domain-Driven Design (DDD)** architecture with **Layered Architecture** patterns, built on top of **NestJS** framework. The application is designed as a task management system with OAuth authentication capabilities.

## Core Architectural Patterns

### 1. Layered Architecture

The application follows a strict layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│           Interface Layer           │ ← HTTP API, Controllers
├─────────────────────────────────────┤
│         Application Layer           │ ← Use Cases, Application Services
├─────────────────────────────────────┤
│           Domain Layer              │ ← Business Logic, Domain Objects
├─────────────────────────────────────┤
│        Infrastructure Layer         │ ← Database, External Services
└─────────────────────────────────────┘
```

#### Layer Responsibilities:

- **Interface Layer** (`src/interface/`): Handles external communication (HTTP APIs, GraphQL, CLI)
- **Application Layer** (`src/application/`): Orchestrates domain objects and infrastructure services
- **Domain Layer** (`src/domain/`): Contains business logic, domain objects, and business rules
- **Infrastructure Layer** (`src/infrastructure/`): Implements technical concerns (database, external APIs, configuration)

### 2. Domain-Driven Design (DDD)

The codebase implements pragmatic DDD with the following key concepts:

#### Domain Objects
- **Entities**: Objects with identity (e.g., `Task`, `User`, `Goal`, `Context`)
- **Value Objects**: Immutable objects without identity (e.g., `IdentityValue`, `EmailValue`, `DescriptionValue`)
- **Aggregates**: Clusters of domain objects that maintain consistency boundaries
- **Domain Services**: Services that implement domain logic not belonging to any single entity

#### Domain Repositories
- **Repository Pattern**: Abstracts data access through domain interfaces
- **In-Memory Implementations**: Used for testing and development
- **Database Implementations**: Production implementations using TypeORM

### 3. Repository Pattern

The repository pattern is implemented with a clear separation between domain interfaces and infrastructure implementations:

```typescript
// Domain Interface
interface TasksInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}

// Infrastructure Implementation
class TasksDomainRepository implements TasksInterface {
  // Implementation details
}
```

### 4. Dependency Inversion Principle

The architecture follows the Dependency Inversion Principle:
- Domain layer defines interfaces
- Infrastructure layer implements these interfaces
- Application layer depends on abstractions, not concretions

### 5. Value Objects Pattern

Value objects are used extensively to encapsulate domain concepts:

```typescript
export class IdentityValue {
  private constructor(public readonly identity: string) {
    Assert(isUUID(identity, "4"));
  }
  
  public static create(): IdentityValue {
    return IdentityValue.fromString(v4());
  }
}
```

### 6. Specification Pattern

Used for complex business rules and validation:

```typescript
export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
```

### 7. Facade Pattern

Domain facades provide simplified interfaces for complex domain operations:

```typescript
export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    // Complex authentication logic
  }
}
```

## Technical Patterns

### 1. Module Pattern (NestJS)

The application uses NestJS modules for dependency injection and organization:

```typescript
@Module({
  imports: [ApiModule, LoggerModule, ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### 2. Configuration Pattern

Centralized configuration management with validation:

```typescript
@Module({
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OrderingConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OrderingConfig],
})
export class ConfigModule {}
```

### 3. Entity Ordering Pattern

Implements spaced integer indexing for efficient task ordering:

```typescript
export class OrderService<T extends OrderInterface> {
  public async newOrdinalNumber(): Promise<number> {
    const lowestOrdinalNumber = await this.entities.searchForLowestOrdinalNumber();
    return lowestOrdinalNumber === null
      ? this.orderingConfig.maxOrdinalNumber
      : lowestOrdinalNumber - this.orderingConfig.ordinalNumbersSpacing;
  }
}
```

### 4. Test Data Builders (Mother Pattern)

Uses the Mother pattern for creating test data:

```typescript
export const userMother = (params: Partial<TUserConstructorParam> = {}) => {
  return new User({
    identity: IdentityValue.create(),
    email: EmailValue.fromString(`${IdentityValue.create().toString()}@gmail.com`),
    refreshTokens: [],
    password: randomString(16),
    emailVerified: false,
    ...params,
  });
};
```

### 5. Fake Services Pattern

Provides deterministic implementations for testing:

```typescript
export class ClockServiceFake implements ClockInterface {
  private now: number = 0;
  
  timeTravelMs(millisecondsSinceEpoch: number) {
    this.now = millisecondsSinceEpoch;
  }
}
```

## Domain Model

### Core Domain Concepts

1. **Task Management**
   - `Task`: Represents a specific activity with a defined outcome
   - `Goal`: A general outcome achievable through completing tasks
   - `Context`: Combination of time, place, and availability that makes tasks doable
   - `Assigned`: Person responsible for completing a task

2. **Authentication & Authorization**
   - `User`: Domain entity representing application users
   - `Client`: OAuth client applications
   - `Token`: JWT tokens for authentication and authorization
   - `Scope`: Permissions and access levels

### Bounded Contexts

1. **Task Management Context**: Core business logic for task organization
2. **Authentication Context**: User management and OAuth implementation

## Benefits of This Architecture

1. **Maintainability**: Clear separation of concerns makes the codebase easy to understand and modify
2. **Testability**: Domain logic can be tested in isolation using in-memory repositories
3. **Flexibility**: Infrastructure can be swapped without affecting domain logic
4. **Scalability**: Modular design allows for easy extension and scaling
5. **Domain Focus**: Business logic is centralized and protected from technical concerns

## Trade-offs

1. **Complexity**: The architecture introduces additional complexity for simple applications
2. **Learning Curve**: Team members need to understand DDD concepts
3. **Over-engineering**: May be excessive for simple CRUD applications
4. **Performance**: Additional abstraction layers may introduce overhead

## Conclusion

This architecture provides a solid foundation for complex business applications that require maintainable, testable, and scalable code. The combination of DDD principles with layered architecture creates a robust structure that can evolve with business requirements while maintaining code quality and developer productivity.
