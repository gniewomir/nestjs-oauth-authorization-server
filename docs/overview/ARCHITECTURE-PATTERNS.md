# Architecture Patterns

## Overview

This document details the specific design patterns implemented in the codebase, providing examples and explanations of their usage.

## Domain-Driven Design Patterns

### 1. Entity Pattern

**Purpose**: Represent objects with identity that persist over time.

**Implementation**:
```typescript
export class Task extends OrderedEntity<TasksInterface> {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;
  public readonly goal: IdentityValue;
  public readonly context: IdentityValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: IdentityValue;
    goal: IdentityValue;
    context: IdentityValue;
    orderKey: string;
  }) {
    super({
      assigned: parameters.assigned,
    });

    this.identity = parameters.identity;
    this.description = parameters.description;
    this.goal = parameters.goal;
    this.context = parameters.context;
    this._orderKey = parameters.orderKey;
  }

  public get orderKey(): string {
    return this._orderKey;
  }

  public async moveBefore(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<TasksInterface>,
  ): Promise<void> {
    this._orderKey = await orderingService.nextAvailableOrderKeyBefore(
      referenceEntityIdentity,
      this.assigned,
    );
  }
}
```

**Characteristics**:
- Has a unique identity (`IdentityValue`)
- Contains business logic and invariants
- Can be persisted and retrieved
- Maintains consistency within aggregates
- Supports LexoRank-style ordering operations

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

  public toString(): string {
    return this.identity;
  }
}
```

**Characteristics**:
- Immutable (readonly properties)
- No identity (equality by value)
- Self-validating (constructor validates)
- Factory methods for creation
- Type-safe conversion methods

### 3. Repository Pattern

**Purpose**: Abstract data access and provide a collection-like interface for domain objects.

**Domain Interface with Symbol**:
```typescript
export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}

export const TasksInterfaceSymbol = Symbol('TasksInterface');
```

**Infrastructure Implementation**:
```typescript
@Injectable()
export class TasksDomainRepository implements TasksInterface {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {}

  async persist(task: Task): Promise<void> {
    const databaseEntity = this.mapToDatabase(task);
    await this.taskRepository.save(databaseEntity);
  }

  async retrieve(identity: IdentityValue): Promise<Task> {
    const databaseEntity = await this.taskRepository.findOne({
      where: { id: identity.toString() },
    });
    
    if (!databaseEntity) {
      throw new Error("Task not found");
    }
    
    return this.mapToDomain(databaseEntity);
  }

  async getOrderKey(identity: IdentityValue): Promise<string> {
    const task = await this.retrieve(identity);
    return task.orderKey;
  }

  async searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null> {
    const tasks = await this.taskRepository.find({
      where: { assignedId: assignedIdentity.toString() },
      order: { orderKey: 'ASC' },
    });

    let previous: string | null = null;
    for (const task of tasks) {
      if (orderKey > task.orderKey) {
        previous = task.orderKey;
      } else if (orderKey === task.orderKey) {
        return previous;
      } else {
        break;
      }
    }

    return previous;
  }

  private mapToDatabase(task: Task): Omit<TaskEntity, "createdAt" | "updatedAt"> {
    return {
      id: task.identity.toString(),
      description: task.description.toString(),
      assignedId: task.assigned.toString(),
      goalId: task.goal.toString(),
      contextId: task.context.toString(),
      orderKey: task.orderKey,
    };
  }

  private mapToDomain(databaseEntity: TaskEntity): Task {
    return new Task({
      identity: IdentityValue.fromString(databaseEntity.id),
      description: DescriptionValue.fromString(databaseEntity.description),
      assigned: IdentityValue.fromString(databaseEntity.assignedId),
      goal: IdentityValue.fromString(databaseEntity.goalId),
      context: IdentityValue.fromString(databaseEntity.contextId),
      orderKey: databaseEntity.orderKey,
    });
  }
}
```

**In-Memory Implementation**:
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
  public static readonly START_ORDER_KEY = "U";

  constructor(private readonly entities: T) {}

  public async newOrderKey(assignedIdentity: IdentityValue): Promise<string> {
    const highest = await this.entities.searchForHighestOrderKey(assignedIdentity);
    return this.between(highest ?? undefined, undefined);
  }

  public async nextAvailableOrderKeyBefore(
    referenceIdentity: IdentityValue,
    assignedIdentity: IdentityValue,
  ): Promise<string> {
    const referenceKey = await this.entities.getOrderKey(referenceIdentity);
    const lowerKey = await this.entities.searchForLowerOrderKey(
      assignedIdentity,
      referenceKey,
    );
    return this.between(lowerKey ?? undefined, referenceKey);
  }

  public async nextAvailableOrderKeyAfter(
    referenceIdentity: IdentityValue,
    assignedIdentity: IdentityValue,
  ): Promise<string> {
    const referenceKey = await this.entities.getOrderKey(referenceIdentity);
    const higherKey = await this.entities.searchForHigherOrderKey(
      assignedIdentity,
      referenceKey,
    );
    return this.between(referenceKey, higherKey ?? undefined);
  }

  public between(a?: string, b?: string): string {
    // LexoRank-style algorithm implementation
    // Generates a string key between two existing keys
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
@Injectable()
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

export const ClockInterfaceSymbol = Symbol('ClockInterface');

// Real implementation
@Injectable()
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

  nowAsMillisecondsSinceEpoch(): number {
    return this.now === 0 ? Date.now() : this.now;
  }

  nowAsSecondsSinceEpoch(): number {
    return this.now === 0
      ? Math.floor(Date.now() / 1000)
      : Math.floor(this.now / 1000);
  }
}
```

### 4. Symbol-based Dependency Injection Pattern

**Purpose**: Provide type-safe dependency injection using TypeScript symbols.

**Implementation**:
```typescript
// Domain interface with symbol
export interface UsersInterface {
  retrieve(identity: IdentityValue): Promise<User>;
  persist(user: User): Promise<void>;
  countByEmail(email: EmailValue): Promise<number>;
}

export const UsersInterfaceSymbol = Symbol('UsersInterface');

// Module configuration
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      provide: UsersInterfaceSymbol,
      useClass: UsersDomainRepository,
    },
  ],
  exports: [UsersInterfaceSymbol],
})
export class UsersDomainRepositoryModule {}

// Service using symbol injection
@Injectable()
export class UserService {
  constructor(
    @Inject(UsersInterfaceSymbol)
    private readonly users: UsersInterface,
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
  ) {}
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

### 2. Fake Object Pattern

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
        const config = new AuthConfig({
          jwtSecret: configService.getOrThrow("JWT_SECRET"),
          jwtAlgorithm: configService.getOrThrow("JWT_ALGORITHM"),
          issuer: configService.getOrThrow("JWT_ISSUER"),
          accessTokenExpirationSeconds: configService.getOrThrow("JWT_ACCESS_TOKEN_EXPIRATION_SECONDS"),
        });
        return deepFreeze(config);
      },
      inject: [ConfigService],
    };
  }
}
```

### 2. Deep Freezing Pattern

**Purpose**: Ensure configuration objects are immutable at runtime.

**Implementation**:
```typescript
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  const frozen = { ...obj };
  Object.keys(frozen).forEach(key => {
    if (typeof frozen[key] === 'object' && frozen[key] !== null) {
      frozen[key] = deepFreeze(frozen[key]);
    }
  });

  return Object.freeze(frozen);
}
```

## Security Patterns

### 1. XSS Prevention Pattern

**Purpose**: Prevent cross-site scripting attacks through input sanitization.

**Implementation**:
```typescript
@Injectable()
export class SanitizationService {
  public sanitizeString(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
}
```

**Usage**:
```typescript
export class DescriptionValue {
  private constructor(public readonly description: string) {
    Assert(description.length > 0, "Description cannot be empty");
    Assert(description.length <= 1000, "Description too long");
  }

  public static fromString(description: string): DescriptionValue {
    const sanitizedDescription = sanitizationService.sanitizeString(description);
    return new DescriptionValue(sanitizedDescription);
  }
}
```

### 2. Input Validation Pattern

**Purpose**: Validate all external input at domain boundaries.

**Implementation**:
```typescript
export class EmailValue {
  private constructor(public readonly email: string) {
    Assert(isEmail(email), "Invalid email format");
  }

  public static fromString(email: string): EmailValue {
    return new EmailValue(email);
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
6. **Type Safety**: Symbol-based injection ensures compile-time type checking
7. **Security**: Built-in security patterns and validation

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
- **Symbol-based DI**: When you need type-safe dependency injection
- **Test Data Builder**: When you need flexible test data creation
- **Fake Object**: When you need deterministic behavior for testing
- **In-Memory Repository**: When you need fast, deterministic data access for testing
- **Configuration Object**: When you need centralized, validated configuration
- **Deep Freezing**: When you need runtime immutability
- **XSS Prevention**: When handling user input that could contain malicious content
- **Input Validation**: When processing external data
- **Assertion Pattern**: When you need to validate conditions and fail fast
