# Architecture Patterns

## Overview

This document details the specific design patterns implemented in the codebase, providing examples and explanations of their usage.

## Domain-Driven Design Patterns

### 1. Entity Pattern

**Purpose**: Represent objects with identity that persist over time.

**Implementation**:
```typescript
export class Task {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;
  public readonly assigned: Assigned;
  public readonly goal: Goal;
  public readonly context: Context;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: Assigned;
    goal: Goal;
    context: Context;
    ordinalNumber: number;
  }) {
    // Constructor implementation
  }
}
```

**Characteristics**:
- Has a unique identity (`IdentityValue`)
- Contains business logic and invariants
- Can be persisted and retrieved
- Maintains consistency within aggregates

### 2. Value Object Pattern

**Purpose**: Represent immutable objects without identity that describe characteristics.

**Implementation**:
```typescript
export class IdentityValue {
  private constructor(public readonly identity: string) {
    Assert(isUUID(identity, "4"));
  }

  public static create(): IdentityValue {
    return IdentityValue.fromString(v4());
  }

  public static fromString(identity: string): IdentityValue {
    return new IdentityValue(identity);
  }

  public isEqual(otherIdentity: IdentityValue): boolean {
    return this.identity.toString() === otherIdentity.toString();
  }
}
```

**Characteristics**:
- Immutable (readonly properties)
- No identity (equality by value)
- Self-validating (constructor validates)
- Factory methods for creation

### 3. Repository Pattern

**Purpose**: Abstract data access and provide a collection-like interface for domain objects.

**Domain Interface**:
```typescript
export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}
```

**Infrastructure Implementation**:
```typescript
export class TasksDomainRepository implements TasksInterface {
  persist(_task: Task): Promise<void> {
    throw new Error("Method not implemented.");
  }

  retrieve(_identity: IdentityValue): Promise<Task> {
    throw new Error("Method not implemented.");
  }
}
```

**In-Memory Implementation**:
```typescript
export class TasksDomainRepositoryInMemory implements TasksInterface {
  public tasks: Task[] = [];

  persist(task: Task): Promise<void> {
    this.tasks.push(task);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Task> {
    for (const task of this.tasks) {
      if (identity.isEqual(task.identity)) {
        return Promise.resolve(task);
      }
    }
    throw new Error("Not found.");
  }
}
```

### 4. Specification Pattern

**Purpose**: Encapsulate complex business rules and validation logic.

**Implementation**:
```typescript
export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
```

**Usage**:
```typescript
public static async create(
  params: TUserConstructorParam,
  uniqueEmailSpecification: UniqueEmailSpecification,
): Promise<User> {
  Assert(
    await uniqueEmailSpecification.isSatisfied(params.email),
    "User email have to be unique",
  );
  return new User(params);
}
```

### 5. Domain Service Pattern

**Purpose**: Implement business logic that doesn't belong to any single entity.

**Implementation**:
```typescript
export class OrderService<T extends OrderInterface> {
  constructor(
    private readonly orderingConfig: OrderingConfig,
    private readonly entities: T,
  ) {}

  public async newOrdinalNumber(): Promise<number> {
    const lowestOrdinalNumber = await this.entities.searchForLowestOrdinalNumber();
    return lowestOrdinalNumber === null
      ? this.orderingConfig.maxOrdinalNumber
      : lowestOrdinalNumber - this.orderingConfig.ordinalNumbersSpacing;
  }

  public async nextAvailableOrdinalNumber(
    taskIdentity: IdentityValue,
  ): Promise<number> {
    const taskOrdinalNumber = await this.entities.getOrdinalNumber(taskIdentity);
    const boundaryOrdinalNumber = await this.entities.searchForLowerOrdinalNumber(taskOrdinalNumber);

    if (boundaryOrdinalNumber === null) {
      return taskOrdinalNumber - this.orderingConfig.ordinalNumbersSpacing;
    }

    return (
      taskOrdinalNumber -
      Math.floor((taskOrdinalNumber - boundaryOrdinalNumber) / 2)
    );
  }
}
```

### 6. Facade Pattern

**Purpose**: Provide a simplified interface to complex subsystems.

**Implementation**:
```typescript
export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    const payload = await tokenPayloads.verify(token);
    Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");
    Assert(payload.hasNotExpired(clock), "jwt expired");
    Assert(
      payload.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      "jwt does not contain required scope",
    );
    return payload;
  }

  public static async refresh(
    refreshToken: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
    users: UsersInterface,
    clients: ClientInterface,
  ): Promise<{
    accessToken: string;
    expiration: number;
    refreshToken: string;
    idToken: string;
  }> {
    // Complex refresh logic
  }
}
```

## Infrastructure Patterns

### 1. Adapter Pattern

**Purpose**: Convert the interface of a class into another interface clients expect.

**Implementation**:
```typescript
export class JwtService implements TokenPayloadInterface {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly authConfig: AuthConfig,
  ) {}

  async verify(token: string): Promise<TokenPayload> {
    return TokenPayload.fromUnknown(
      await this.jwtService.verifyAsync(token, {
        algorithms: [this.authConfig.jwtAlgorithm],
        secret: this.authConfig.jwtSecret,
        complete: false,
      }),
    );
  }
}
```

### 2. Factory Pattern

**Purpose**: Create objects without specifying their exact classes.

**Implementation**:
```typescript
export class TokenPayload {
  public static createAccessToken({
    authConfig,
    user,
    scope,
    clock,
    client,
  }: {
    authConfig: AuthConfig;
    user: User;
    scope: ScopeValueImmutableSet;
    clock: ClockInterface;
    client: Client;
  }): TokenPayload {
    return new TokenPayload({
      iss: authConfig.issuer,
      sub: user.identity.toString(),
      aud: client.identity.toString(),
      exp: clock.nowAsSecondsSinceEpoch() + authConfig.accessTokenExpirationSeconds,
      iat: clock.nowAsSecondsSinceEpoch(),
      scope: scope.toString(),
    });
  }
}
```

### 3. Strategy Pattern

**Purpose**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Implementation** (Clock Interface):
```typescript
export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;
  nowAsSecondsSinceEpoch(): number;
}

// Real implementation
export class ClockService implements ClockInterface {
  nowAsSecondsSinceEpoch(): number {
    return Math.floor(Date.now() / 1000);
  }
  nowAsMillisecondsSinceEpoch(): number {
    return Date.now();
  }
}

// Fake implementation for testing
export class ClockServiceFake implements ClockInterface {
  private now: number = 0;

  timeTravelMs(millisecondsSinceEpoch: number) {
    this.now = millisecondsSinceEpoch;
  }
}
```

## Testing Patterns

### 1. Test Data Builder (Mother Pattern)

**Purpose**: Create test data in a flexible and readable way.

**Implementation**:
```typescript
export const userMother = (params: Partial<TUserConstructorParam> = {}) => {
  return new User({
    identity: IdentityValue.create(),
    email: EmailValue.fromString(
      `${IdentityValue.create().toString()}@gmail.com`,
    ),
    refreshTokens: [],
    password: randomString(16),
    emailVerified: false,
    ...params,
  });
};
```

**Usage**:
```typescript
const user = userMother({ emailVerified: true });
const adminUser = userMother({ 
  email: EmailValue.fromString("admin@example.com"),
  emailVerified: true 
});
```

### 2. Fake Object Pattern

**Purpose**: Provide deterministic implementations for testing.

**Implementation**:
```typescript
export class ClockServiceFake implements ClockInterface {
  private now: number = 0;

  nowAsMillisecondsSinceEpoch(): number {
    return this.now === 0 ? Date.now() : this.now;
  }

  timeTravelMs(millisecondsSinceEpoch: number) {
    this.now = millisecondsSinceEpoch;
  }

  returnToPresent() {
    this.now = 0;
  }
}
```

### 3. In-Memory Repository Pattern

**Purpose**: Provide fast, deterministic data access for testing.

**Implementation**:
```typescript
export class TasksDomainRepositoryInMemory implements TasksInterface {
  public tasks: Task[] = [];

  persist(task: Task): Promise<void> {
    this.tasks.push(task);
    return Promise.resolve(undefined);
  }

  retrieve(identity: IdentityValue): Promise<Task> {
    for (const task of this.tasks) {
      if (identity.isEqual(task.identity)) {
        return Promise.resolve(task);
      }
    }
    throw new Error("Not found.");
  }
}
```

## Configuration Patterns

### 1. Configuration Object Pattern

**Purpose**: Centralize and validate application configuration.

**Implementation**:
```typescript
export class AuthConfig {
  public readonly jwtSecret: string;
  public readonly jwtAlgorithm: string;
  public readonly issuer: string;
  public readonly accessTokenExpirationSeconds: number;

  private constructor(config: {
    jwtSecret: string;
    jwtAlgorithm: string;
    issuer: string;
    accessTokenExpirationSeconds: number;
  }) {
    this.jwtSecret = config.jwtSecret;
    this.jwtAlgorithm = config.jwtAlgorithm;
    this.issuer = config.issuer;
    this.accessTokenExpirationSeconds = config.accessTokenExpirationSeconds;
  }

  public static provider() {
    return {
      provide: AuthConfig,
      useFactory: (configService: ConfigService) => {
        return new AuthConfig({
          jwtSecret: configService.getOrThrow("JWT_SECRET"),
          jwtAlgorithm: configService.getOrThrow("JWT_ALGORITHM"),
          issuer: configService.getOrThrow("JWT_ISSUER"),
          accessTokenExpirationSeconds: configService.getOrThrow("JWT_ACCESS_TOKEN_EXPIRATION_SECONDS"),
        });
      },
      inject: [ConfigService],
    };
  }
}
```

## Error Handling Patterns

### 1. Assertion Pattern

**Purpose**: Validate conditions and fail fast with clear error messages.

**Implementation**:
```typescript
export function Assert(
  condition: boolean,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message || "Failed assertion");
  }
}
```

**Usage**:
```typescript
Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");
Assert(payload.hasNotExpired(clock), "jwt expired");
Assert(
  await uniqueEmailSpecification.isSatisfied(params.email),
  "User email have to be unique",
);
```

## Benefits of These Patterns

1. **Maintainability**: Clear separation of concerns and well-defined interfaces
2. **Testability**: Easy to create test doubles and isolate components
3. **Flexibility**: Patterns allow for easy extension and modification
4. **Readability**: Code intent is clear and self-documenting
5. **Reusability**: Patterns can be applied consistently across the codebase

## When to Use Each Pattern

- **Entity Pattern**: When you need objects with identity and business logic
- **Value Object Pattern**: When you need immutable objects that represent concepts
- **Repository Pattern**: When you need to abstract data access
- **Specification Pattern**: When you have complex business rules or validation
- **Domain Service Pattern**: When business logic doesn't belong to any single entity
- **Facade Pattern**: When you need to simplify complex subsystem interactions
- **Adapter Pattern**: When you need to integrate with external systems
- **Factory Pattern**: When object creation is complex or conditional
- **Strategy Pattern**: When you need interchangeable algorithms
- **Test Data Builder**: When you need flexible test data creation
- **Fake Object**: When you need deterministic behavior for testing
- **Configuration Object**: When you need centralized, validated configuration
- **Assertion Pattern**: When you need to validate conditions and fail fast
