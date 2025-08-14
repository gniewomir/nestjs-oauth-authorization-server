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

## Testing Patterns

### 1. Test Data Builders (Mother Pattern)

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
// Basic user
const user = userMother();

// User with specific properties
const verifiedUser = userMother({ emailVerified: true });

// Admin user
const adminUser = userMother({ 
  email: EmailValue.fromString("admin@example.com"),
  emailVerified: true 
});
```

**Benefits**:
- Flexible test data creation
- Readable test setup
- Reusable across multiple tests
- Easy to maintain and modify

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
```

**Usage**:
```typescript
describe('AuthenticationFacade', () => {
  let clock: ClockServiceFake;

  beforeEach(() => {
    clock = new ClockServiceFake();
  });

  it('should reject expired tokens', async () => {
    // Set time to future
    clock.timeTravelSeconds(Date.now() / 1000 + 3600); // 1 hour in future
    
    const expiredToken = createExpiredToken();
    
    await expect(
      AuthenticationFacade.authenticate(expiredToken, tokenPayloads, clock, authConfig)
    ).rejects.toThrow('jwt expired');
  });
});
```

**Benefits**:
- Deterministic behavior
- Control over time-dependent operations
- Easy to test edge cases
- No external dependencies

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

  async getOrdinalNumber(identity: IdentityValue): Promise<number> {
    const task = await this.retrieve(identity);
    return Promise.resolve(task.ordinalNumber);
  }

  searchForLowerOrdinalNumber(ordinalNumber: number): Promise<number | null> {
    const sorted = this.tasks.toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    for (const task of sorted) {
      if (ordinalNumber > task.ordinalNumber) {
        return Promise.resolve(task.ordinalNumber);
      }
    }

    return Promise.resolve(null);
  }

  async searchForLowestOrdinalNumber(): Promise<number | null> {
    const sorted = this.tasks.toSorted(
      (a, b) => b.ordinalNumber - a.ordinalNumber,
    );

    if (sorted.length === 0) {
      return Promise.resolve(null);
    }

    return sorted[sorted.length - 1].ordinalNumber;
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
    orderService = new OrderService(orderingConfig, tasksRepository);
  });

  it('should assign first ordinal number when no tasks exist', async () => {
    const ordinalNumber = await orderService.newOrdinalNumber();
    
    expect(ordinalNumber).toBe(orderingConfig.maxOrdinalNumber);
  });

  it('should assign ordinal number between existing tasks', async () => {
    const task1 = taskMother({ ordinalNumber: 1000 });
    const task2 = taskMother({ ordinalNumber: 500 });
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const ordinalNumber = await orderService.newOrdinalNumber();
    
    expect(ordinalNumber).toBe(500 - orderingConfig.ordinalNumbersSpacing);
  });
});
```

**Benefits**:
- Fast execution
- No database setup required
- Deterministic results
- Easy to set up test scenarios

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
    
    const token = createValidToken(user, client);
    
    const result = await AuthenticationFacade.authenticate(
      token,
      context.tokenPayloads,
      context.clock,
      authConfig
    );
    
    expect(result).toBeDefined();
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
  });

  it('should move task before another task', async () => {
    const task1 = taskMother({ ordinalNumber: 1000 });
    const task2 = taskMother({ ordinalNumber: 500 });
    const tasksRepository = new TasksDomainRepositoryInMemory();
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const orderService = new OrderService(orderingConfig, tasksRepository);
    
    await task1.moveBefore(task2.identity, orderService);
    
    expect(task1.ordinalNumber).toBeLessThan(task2.ordinalNumber);
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
```

### 3. Domain Service Testing

**Focus**: Test business logic that spans multiple entities.

```typescript
describe('OrderService', () => {
  let tasksRepository: TasksDomainRepositoryInMemory;
  let orderService: OrderService<TasksInterface>;

  beforeEach(() => {
    tasksRepository = new TasksDomainRepositoryInMemory();
    orderService = new OrderService(orderingConfig, tasksRepository);
  });

  it('should calculate new ordinal number for empty repository', async () => {
    const ordinalNumber = await orderService.newOrdinalNumber();
    
    expect(ordinalNumber).toBe(orderingConfig.maxOrdinalNumber);
  });

  it('should calculate ordinal number between existing tasks', async () => {
    const task1 = taskMother({ ordinalNumber: 1000 });
    const task2 = taskMother({ ordinalNumber: 500 });
    
    await tasksRepository.persist(task1);
    await tasksRepository.persist(task2);
    
    const ordinalNumber = await orderService.nextAvailableOrdinalNumber(task1.identity);
    
    expect(ordinalNumber).toBeLessThan(task1.ordinalNumber);
    expect(ordinalNumber).toBeGreaterThan(task2.ordinalNumber);
  });
});
```

## Infrastructure Layer Testing

### 1. Repository Testing

**Focus**: Test data persistence and retrieval logic.

```typescript
describe('TasksDomainRepository', () => {
  let repository: TasksDomainRepository;
  let dataSource: DataSource;

  beforeEach(async () => {
    // Setup test database
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [TaskEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    
    repository = new TasksDomainRepository(dataSource);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('should persist and retrieve task', async () => {
    const task = taskMother();
    
    await repository.persist(task);
    const retrieved = await repository.retrieve(task.identity);
    
    expect(retrieved.identity.isEqual(task.identity)).toBe(true);
    expect(retrieved.description.toString()).toBe(task.description.toString());
  });

  it('should throw error when task not found', async () => {
    const identity = IdentityValue.create();
    
    await expect(repository.retrieve(identity)).rejects.toThrow('Not found.');
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
  }
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

### 3. Mocking Strategy

- Mock external dependencies
- Use fake implementations for deterministic behavior
- Avoid mocking domain objects
- Mock at the right level of abstraction

### 4. Test Coverage

- Aim for high coverage of domain logic
- Focus on business-critical paths
- Test edge cases and error conditions
- Use coverage reports to identify gaps

## Benefits of This Testing Approach

### 1. Reliability

- Deterministic test results
- Fast execution
- No external dependencies
- Consistent test environment

### 2. Maintainability

- Clear test structure
- Reusable test utilities
- Easy to understand and modify
- Well-organized test code

### 3. Confidence

- High test coverage
- Comprehensive test scenarios
- Business logic validation
- Regression prevention

### 4. Development Speed

- Fast feedback loop
- Easy to write new tests
- Quick test execution
- Reduced debugging time

## Conclusion

The testing architecture in this codebase provides a comprehensive approach to ensuring code quality and reliability. By combining unit tests, integration tests, and end-to-end tests with well-designed test utilities and patterns, the codebase achieves high test coverage while maintaining fast execution and clear test organization. This approach supports the Domain-Driven Design principles and layered architecture, making the codebase more maintainable and reliable.
