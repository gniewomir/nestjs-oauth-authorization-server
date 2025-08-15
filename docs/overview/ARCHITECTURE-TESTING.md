# Testing Architecture

## Overview

This codebase implements a comprehensive testing strategy that aligns with the Domain-Driven Design and Layered Architecture patterns. The testing approach focuses on isolating business logic, providing deterministic test environments, and ensuring high test coverage across all layers.

## Testing Strategy

### 1. Test Pyramid

The codebase follows the test pyramid approach:

```
    /\
   /  \     ← E2E Tests (Few)
  /____\    ← Integration Tests (Some)
 /______\   ← Unit Tests (Many)
```

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test complete user workflows

### 2. Layer-Specific Testing

Each layer has specific testing approaches:

- **Domain Layer**: Pure unit tests with in-memory repositories
- **Application Layer**: Unit tests with mocked dependencies
- **Infrastructure Layer**: Integration tests with real external dependencies
- **Interface Layer**: Integration tests with HTTP clients

### 3. Database Testing Strategy

**Real Database Testing**: All repository tests hit actual database with migrations
**Transactional Tests**: Using `typeorm-transactional-tests` for isolation
**Parallel Testing**: Support for parallel test execution with transaction isolation
**Migration-based**: Tests run against production schema, not TypeORM sync

## Testing Patterns

### 1. Test Data Builders (Mother Pattern)

**Purpose**: Create test data in a flexible and readable way.

**Implementation**:
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

export const taskMother = (params: Partial<TTaskConstructorParam> = {}) => {
  return new Task({
    identity: IdentityValue.create(),
    description: DescriptionValue.fromString("example task"),
    assigned: IdentityValue.create(),
    goal: IdentityValue.create(),
    context: IdentityValue.create(),
    orderKey: OrderService.START_ORDER_KEY,
    ...params,
  });
};

export const goalMother = (params: Partial<TGoalConstructorParam> = {}) => {
  return new Goal({
    identity: IdentityValue.create(),
    description: DescriptionValue.fromString("example goal"),
    assigned: IdentityValue.create(),
    orderKey: OrderService.START_ORDER_KEY,
    ...params,
  });
};

export const contextMother = (params: Partial<TContextConstructorParam> = {}) => {
  return new Context({
    identity: IdentityValue.create(),
    description: DescriptionValue.fromString("example context"),
    assigned: IdentityValue.create(),
    orderKey: OrderService.START_ORDER_KEY,
    ...params,
  });
};
```

**Usage**:
```typescript
// Basic user
const user = userMother();

// User with specific properties
const verifiedUser = userMother({ emailVerified: true });

// Admin user
const adminUser = userMother({ 
  email: EmailValue.fromString("admin@example.com"),
  emailVerified: true 
});

// Task with specific properties
const highPriorityTask = taskMother({ 
  orderKey: "V",
  description: DescriptionValue.fromString("urgent task")
});

// Complex object composition
const taskWithSpecificGoal = taskMother({
  goal: IdentityValue.fromString("specific-goal-id")
});
```

**Benefits**:
- Flexible test data creation
- Readable test setup
- Reusable across multiple tests
- Easy to maintain and modify
- Supports complex object composition

### 2. Fake Services Pattern

**Purpose**: Provide deterministic implementations for testing.

**Implementation**:
```typescript
export class ClockServiceFake implements ClockInterface {
  private now: number = 0;

  nowAsMillisecondsSinceEpoch(): number {
    return this.now === 0 ? Date.now() : this.now;
  }

  nowAsSecondsSinceEpoch(): number {
    return this.now === 0
      ? Math.floor(Date.now() / 1000)
      : Math.floor(this.now / 1000);
  }

  timeTravelMs(millisecondsSinceEpoch: number) {
    this.now = millisecondsSinceEpoch;
  }

  timeTravelSeconds(secondsSinceEpoch: number) {
    this.timeTravelMs(secondsSinceEpoch * 1000);
  }

  returnToPresent() {
    this.now = 0;
  }
}

export class JwtServiceFake implements TokenPayloadInterface {
  private tokens = new Map<string, TokenPayload>();

  async verify(token: string): Promise<TokenPayload> {
    const payload = this.tokens.get(token);
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }

  async sign(tokenPayload: Record<string, unknown>): Promise<string> {
    const token = randomString(32);
    this.tokens.set(token, TokenPayload.fromUnknown(tokenPayload));
    return token;
  }

  addToken(token: string, payload: TokenPayload) {
    this.tokens.set(token, payload);
  }
}
```

**Usage**:
```typescript
describe('AuthenticationFacade', () => {
  let clock: ClockServiceFake;
  let jwtService: JwtServiceFake;

  beforeEach(() => {
    clock = new ClockServiceFake();
    jwtService = new JwtServiceFake();
  });

  it('should reject expired tokens', async () => {
    // Set time to future
    clock.timeTravelSeconds(Date.now() / 1000 + 3600); // 1 hour in future
    
    const expiredToken = createExpiredToken();
    
    await expect(
      AuthenticationFacade.authenticate(expiredToken, jwtService, clock, authConfig)
    ).rejects.toThrow('jwt expired');
  });

  it('should accept valid tokens', async () => {
    const validPayload = TokenPayload.createAccessToken({
      authConfig,
      user: userMother(),
      scope: ScopeValueImmutableSet.fromArray([ScopeValue.TOKEN_AUTHENTICATE()]),
      clock,
      client: clientMother(),
    });
    
    const token = await jwtService.sign(validPayload);
    
    const result = await AuthenticationFacade.authenticate(
      token,
      jwtService,
      clock,
      authConfig
    );
    
    expect(result).toBeDefined();
  });
});
```

**Benefits**:
- Deterministic behavior
- Control over time-dependent operations
- Easy to test edge cases
- No external dependencies
- Predictable test results

### 3. In-Memory Repository Pattern

**Purpose**: Provide fast, deterministic data access for testing.

**Implementation**:
```typescript
export class TasksDomainRepositoryInMemory implements TasksInterface {
  public tasks = new Map<string, Task>();

  persist(task: Task): Promise<void> {
    this.tasks.set(task.identity.toString(), task);
    return Promise.resolve();
  }

  retrieve(identity: IdentityValue): Promise<Task> {
    const task = this.tasks.get(identity.toString());
    if (task instanceof Task) {
      return Promise.resolve(task);
    }
    return Promise.reject(new Error("Task not found"));
  }

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const task = await this.retrieve(identity);
    return Promise.resolve(task.orderKey);
  }

  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const sorted = Array.from(this.tasks.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
      .sort((a, b) => a.orderKey.localeCompare(b.orderKey));

    let previous: string | null = null;
    for (const task of sorted) {
      if (orderKey > task.orderKey) {
        previous = task.orderKey;
      } else if (orderKey === task.orderKey) {
        return Promise.resolve(previous);
      } else {
        break;
      }
    }

    return Promise.resolve(previous);
  }

  async searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null> {
    const sorted = Array.from(this.tasks.values())
      .filter((t) => t.assigned.toString() === assignedIdentity.toString())
      .sort((a, b) => a.orderKey.localeCompare(b.orderKey));

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].orderKey;
  }
}
```

**Usage**:
```typescript
describe('OrderService', () => {
  let tasksRepository: TasksDomainRepositoryInMemory;
  let orderService: OrderService<TasksInterface>;

  beforeEach(() => {
    tasksRepository = new TasksDomainRepositoryInMemory();
    orderService = new OrderService(tasksRepository);
  });

  it('should assign first order key when no tasks exist', async () => {
    const orderKey = await orderService.newOrderKey(assignedIdentity);
    
    expect(orderKey).toBe(OrderService.START_ORDER_KEY);
  });

  it('should assign order key between existing tasks', async () => {
    const task1 = taskMother({ orderKey: "U" });
    const task2 = taskMother({ orderKey: "V" });
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const orderKey = await orderService.newOrderKey(assignedIdentity);
    
    expect(orderKey).toBeGreaterThan("V");
  });

  it('should calculate next available order key for task reordering', async () => {
    const task1 = taskMother({ orderKey: "U" });
    const task2 = taskMother({ orderKey: "V" });
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const newOrderKey = await orderService.nextAvailableOrderKeyBefore(task2.identity, assignedIdentity);
    
    expect(newOrderKey).toBeGreaterThan("U");
    expect(newOrderKey).toBeLessThan("V");
  });
});
```

**Benefits**:
- Fast execution
- No database setup required
- Deterministic results
- Easy to set up test scenarios
- Supports complex LexoRank-style ordering operations

### 4. Test Context Pattern

**Purpose**: Provide shared test setup and utilities.

**Implementation**:
```typescript
export class AuthenticationTestContext {
  public readonly clock: ClockServiceFake;
  public readonly usersRepository: UsersDomainRepositoryInMemory;
  public readonly clientsRepository: ClientDomainRepositoryInMemory;
  public readonly tokenPayloads: TokenPayloadInterface;

  constructor() {
    this.clock = new ClockServiceFake();
    this.usersRepository = new UsersDomainRepositoryInMemory();
    this.clientsRepository = new ClientDomainRepositoryInMemory();
    this.tokenPayloads = new JwtServiceFake();
  }

  createUser(params: Partial<TUserConstructorParam> = {}) {
    return userMother(params);
  }

  createClient(params: Partial<TClientConstructorParam> = {}) {
    return clientMother(params);
  }

  async setupUser(user: User) {
    await this.usersRepository.persist(user);
  }

  async setupClient(client: Client) {
    await this.clientsRepository.persist(client);
  }

  createValidToken(user: User, client: Client): string {
    const payload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromArray([ScopeValue.TOKEN_AUTHENTICATE()]),
      clock: this.clock,
      client,
    });
    
    return this.tokenPayloads.sign(payload);
  }
}
```

**Usage**:
```typescript
describe('AuthenticationFacade', () => {
  let context: AuthenticationTestContext;

  beforeEach(() => {
    context = new AuthenticationTestContext();
  });

  it('should authenticate valid token', async () => {
    const user = context.createUser();
    const client = context.createClient();
    
    await context.setupUser(user);
    await context.setupClient(client);
    
    const token = context.createValidToken(user, client);
    
    const result = await AuthenticationFacade.authenticate(
      token,
      context.tokenPayloads,
      context.clock,
      authConfig
    );
    
    expect(result).toBeDefined();
  });

  it('should reject token with invalid scope', async () => {
    const user = context.createUser();
    const client = context.createClient();
    
    await context.setupUser(user);
    await context.setupClient(client);
    
    const invalidPayload = TokenPayload.createAccessToken({
      authConfig,
      user,
      scope: ScopeValueImmutableSet.fromArray([ScopeValue.TASK_API()]), // Wrong scope
      clock: context.clock,
      client,
    });
    
    const token = await context.tokenPayloads.sign(invalidPayload);
    
    await expect(
      AuthenticationFacade.authenticate(token, context.tokenPayloads, context.clock, authConfig)
    ).rejects.toThrow('jwt does not contain required scope');
  });
});
```

## Domain Layer Testing

### 1. Entity Testing

**Focus**: Test business logic, invariants, and behavior.

```typescript
describe('Task', () => {
  it('should create task with valid parameters', () => {
    const task = taskMother();
    
    expect(task.identity).toBeDefined();
    expect(task.description).toBeDefined();
    expect(task.assigned).toBeDefined();
    expect(task.goal).toBeDefined();
    expect(task.context).toBeDefined();
    expect(task.orderKey).toBeDefined();
  });

  it('should move task before another task', async () => {
    const task1 = taskMother({ orderKey: "U" });
    const task2 = taskMother({ orderKey: "V" });
    const tasksRepository = new TasksDomainRepositoryInMemory();
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const orderService = new OrderService(tasksRepository);
    
    await task1.moveBefore(task2.identity, orderService);
    
    expect(task1.orderKey).toBeLessThan(task2.orderKey);
  });

  it('should maintain ordering invariants', () => {
    const task = taskMother({ orderKey: "U" });
    
    expect(task.orderKey).toBe("U");
    expect(typeof task.orderKey).toBe('string');
  });
});
```

### 2. Value Object Testing

**Focus**: Test validation, equality, and immutability.

```typescript
describe('IdentityValue', () => {
  it('should create valid UUID', () => {
    const identity = IdentityValue.create();
    
    expect(identity.toString()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should reject invalid UUID', () => {
    expect(() => IdentityValue.fromString('invalid-uuid')).toThrow();
  });

  it('should be equal to same UUID', () => {
    const uuid = '123e4567-e89b-42d3-a456-556642440000';
    const identity1 = IdentityValue.fromString(uuid);
    const identity2 = IdentityValue.fromString(uuid);
    
    expect(identity1.isEqual(identity2)).toBe(true);
  });

  it('should not be equal to different UUID', () => {
    const identity1 = IdentityValue.fromString('123e4567-e89b-42d3-a456-556642440000');
    const identity2 = IdentityValue.fromString('987fcdeb-51a2-43d1-b789-123456789abc');
    
    expect(identity1.isEqual(identity2)).toBe(false);
  });
});

describe('EmailValue', () => {
  it('should accept valid email', () => {
    const email = EmailValue.fromString('test@example.com');
    expect(email.toString()).toBe('test@example.com');
  });

  it('should reject invalid email', () => {
    expect(() => EmailValue.fromString('invalid-email')).toThrow();
  });
});

describe('DescriptionValue', () => {
  it('should accept valid description', () => {
    const description = DescriptionValue.fromString('Valid description');
    expect(description.toString()).toBe('Valid description');
  });

  it('should reject empty description', () => {
    expect(() => DescriptionValue.fromString('')).toThrow('Description cannot be empty');
  });

  it('should reject too long description', () => {
    const longDescription = 'a'.repeat(1001);
    expect(() => DescriptionValue.fromString(longDescription)).toThrow('Description too long');
  });
});
```

### 3. Domain Service Testing

**Focus**: Test business logic that spans multiple entities.

```typescript
describe('OrderService', () => {
  let tasksRepository: TasksDomainRepositoryInMemory;
  let orderService: OrderService<TasksInterface>;

  beforeEach(() => {
    tasksRepository = new TasksDomainRepositoryInMemory();
    orderService = new OrderService(tasksRepository);
  });

  it('should calculate new order key for empty repository', async () => {
    const orderKey = await orderService.newOrderKey(assignedIdentity);
    
    expect(orderKey).toBe(OrderService.START_ORDER_KEY);
  });

  it('should calculate order key between existing tasks', async () => {
    const task1 = taskMother({ orderKey: "U" });
    const task2 = taskMother({ orderKey: "V" });
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const orderKey = await orderService.nextAvailableOrderKeyBefore(task1.identity, assignedIdentity);
    
    expect(orderKey).toBeLessThan(task1.orderKey);
    expect(orderKey).toBeGreaterThan(task2.orderKey);
  });

  it('should handle edge case when moving to first position', async () => {
    const task = taskMother({ orderKey: "U" });
    await tasksRepository.persist(task);
    
    const orderKey = await orderService.nextAvailableOrderKeyBefore(task.identity, assignedIdentity);
    
    expect(orderKey).toBeLessThan("U");
  });
});
```

### 4. Specification Testing

**Focus**: Test complex business rules and validation logic.

```typescript
describe('UniqueEmailSpecification', () => {
  let usersRepository: UsersDomainRepositoryInMemory;
  let specification: UniqueEmailSpecification;

  beforeEach(() => {
    usersRepository = new UsersDomainRepositoryInMemory();
    specification = new UniqueEmailSpecification(usersRepository);
  });

  it('should be satisfied when email is unique', async () => {
    const email = EmailValue.fromString('unique@example.com');
    
    const isSatisfied = await specification.isSatisfied(email);
    
    expect(isSatisfied).toBe(true);
  });

  it('should not be satisfied when email already exists', async () => {
    const email = EmailValue.fromString('existing@example.com');
    const user = userMother({ email });
    
    await usersRepository.persist(user);
    
    const isSatisfied = await specification.isSatisfied(email);
    
    expect(isSatisfied).toBe(false);
  });
});
```

## Infrastructure Layer Testing

### 1. Repository Testing

**Focus**: Test data persistence and retrieval logic with real database.

```typescript
describe('TasksDomainRepository', () => {
  let repository: TasksDomainRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule,
        TypeOrmModule.forFeature([TaskEntity]),
      ],
      providers: [TasksDomainRepository],
    }).compile();

    repository = module.get<TasksDomainRepository>(TasksDomainRepository);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should persist and retrieve task', async () => {
    const task = taskMother();
    
    await repository.persist(task);
    const retrieved = await repository.retrieve(task.identity);
    
    expect(retrieved.identity.toString()).toBe(task.identity.toString());
    expect(retrieved.description.toString()).toBe(task.description.toString());
    expect(retrieved.orderKey).toBe(task.orderKey);
  });

  it('should throw error when task not found', async () => {
    const identity = IdentityValue.create();
    
    await expect(repository.retrieve(identity)).rejects.toThrow('Task not found');
  });

  it('should handle ordering operations correctly', async () => {
    const task1 = taskMother({ orderKey: "U" });
    const task2 = taskMother({ orderKey: "V" });
    
    await repository.persist(task1);
    await repository.persist(task2);
    
    const highestOrderKey = await repository.searchForHighestOrderKey(assignedIdentity);
    expect(highestOrderKey).toBe("V");
    
    const lowerOrderKey = await repository.searchForLowerOrderKey(assignedIdentity, "V");
    expect(lowerOrderKey).toBe("U");
  });
});
```

### 2. Adapter Testing

**Focus**: Test integration with external services.

```typescript
describe('JwtService', () => {
  let jwtService: JwtService;
  let nestJwtService: JwtService;

  beforeEach(() => {
    nestJwtService = new JwtService('secret');
    jwtService = new JwtService(nestJwtService, authConfig);
  });

  it('should verify valid token', async () => {
    const payload = { sub: 'user123', exp: Date.now() / 1000 + 3600 };
    const token = await nestJwtService.sign(payload);
    
    const result = await jwtService.verify(token);
    
    expect(result.sub).toBe('user123');
  });

  it('should reject expired token', async () => {
    const payload = { sub: 'user123', exp: Date.now() / 1000 - 3600 };
    const token = await nestJwtService.sign(payload);
    
    await expect(jwtService.verify(token)).rejects.toThrow();
  });
});
```

### 3. Configuration Testing

**Focus**: Test configuration validation and deep freezing.

```typescript
describe('AuthConfig', () => {
  it('should create valid configuration', () => {
    const config = new AuthConfig({
      jwtSecret: 'secret',
      jwtAlgorithm: 'HS256',
      issuer: 'test-issuer',
      accessTokenExpirationSeconds: 3600,
    });
    
    expect(config.jwtSecret).toBe('secret');
    expect(config.jwtAlgorithm).toBe('HS256');
    expect(config.issuer).toBe('test-issuer');
    expect(config.accessTokenExpirationSeconds).toBe(3600);
  });

  it('should be deeply frozen', () => {
    const config = new AuthConfig({
      jwtSecret: 'secret',
      jwtAlgorithm: 'HS256',
      issuer: 'test-issuer',
      accessTokenExpirationSeconds: 3600,
    });
    
    expect(Object.isFrozen(config)).toBe(true);
  });
});
```

## Integration Testing

### 1. End-to-End Testing

**Focus**: Test complete user workflows.

```typescript
describe('Task Management E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create and retrieve task', async () => {
    const createTaskDto = {
      description: 'Test task',
      goalId: 'goal-123',
      contextId: 'context-123',
      userId: 'user-123',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .send(createTaskDto)
      .expect(201);

    const taskId = createResponse.body.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .expect(200);

    expect(getResponse.body.description).toBe(createTaskDto.description);
  });
});
```

### 2. Transactional Testing

**Focus**: Test database operations with transaction isolation.

```typescript
describe('Transactional Tests', () => {
  it('should rollback changes after test', async () => {
    const task = taskMother();
    
    // This should be rolled back after the test
    await repository.persist(task);
    
    const retrieved = await repository.retrieve(task.identity);
    expect(retrieved.identity.toString()).toBe(task.identity.toString());
  });

  it('should not see changes from other tests', async () => {
    // This test should not see the task from the previous test
    const identity = IdentityValue.create();
    
    await expect(repository.retrieve(identity)).rejects.toThrow('Task not found');
  });
});
```

## Test Configuration

### 1. Jest Configuration

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^@domain/(.*)$": "<rootDir>/domain/$1",
    "^@infrastructure/(.*)$": "<rootDir>/infrastructure/$1",
    "^@interface/(.*)$": "<rootDir>/interface/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@application/(.*)$": "<rootDir>/application/$1"
  },
  "setupFilesAfterEnv": ["<rootDir>/test/jest-setup.ts"]
}
```

### 2. Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

### 3. Jest Setup

```typescript
// src/test/jest-setup.ts
import { setupTransactionalTests } from 'typeorm-transactional-tests';

setupTransactionalTests();
```

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the scenario
- Follow the Arrange-Act-Assert pattern
- Keep tests independent and isolated

### 2. Test Data Management

- Use test data builders for consistent test data creation
- Avoid hardcoded test data
- Make test data as realistic as possible
- Use factories for complex object creation
- Use high entropy data for uniqueness constraints

### 3. Mocking Strategy

- Mock external dependencies
- Use fake implementations for deterministic behavior
- Avoid mocking domain objects
- Mock at the right level of abstraction
- Use symbol-based injection for test doubles

### 4. Test Coverage

- Aim for high coverage of domain logic
- Focus on business-critical paths
- Test edge cases and error conditions
- Use coverage reports to identify gaps

### 5. Database Testing

- Use real database with migrations
- Implement transaction isolation
- Support parallel test execution
- Use deterministic test data
- Test against production schema

## Benefits of This Testing Approach

### 1. Reliability

- Deterministic test results
- Fast execution
- No external dependencies
- Consistent test environment
- Transaction isolation

### 2. Maintainability

- Clear test structure
- Reusable test utilities
- Easy to understand and modify
- Well-organized test code
- Symbol-based dependency injection

### 3. Confidence

- High test coverage
- Comprehensive test scenarios
- Business logic validation
- Regression prevention
- Real database testing

### 4. Development Speed

- Fast feedback loop
- Easy to write new tests
- Quick test execution
- Reduced debugging time
- Parallel test execution

### 5. Type Safety

- Compile-time type checking
- Symbol-based injection
- Interface contracts enforced
- Refactoring safety

## Conclusion

The testing architecture in this codebase provides a comprehensive approach to ensuring code quality and reliability. By combining unit tests, integration tests, and end-to-end tests with well-designed test utilities and patterns, the codebase achieves high test coverage while maintaining fast execution and clear test organization. The addition of transactional testing, symbol-based dependency injection, and comprehensive test data builders ensures the testing approach is both robust and maintainable. This approach supports the Domain-Driven Design principles and layered architecture, making the codebase more maintainable and reliable.
