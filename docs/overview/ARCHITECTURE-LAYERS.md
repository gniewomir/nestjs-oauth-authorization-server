# Layered Architecture

## Overview

This codebase implements a strict **Layered Architecture** pattern with clear separation of concerns across four distinct layers. Each layer has specific responsibilities and dependencies, following the Dependency Inversion Principle with symbol-based interface injection.

## Layer Structure

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

## Layer Details

### 1. Interface Layer (`src/interface/`)

**Purpose**: Handle external communication and present the application to the outside world.

**Responsibilities**:
- HTTP API endpoints and controllers
- Request/response handling
- Input validation and transformation
- Error handling for external clients
- API documentation and contracts
- Security headers and CORS configuration

**Dependencies**:
- Can depend on Application Layer
- Can depend on Infrastructure Layer (for cross-cutting concerns like logging)

**Examples**:
```typescript
// Status Controller
@Controller()
export class StatusController {
  @Get()
  getStatus(): string {
    return "OK";
  }
}

// API Module
@Module({
  imports: [StatusModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
```

**Key Characteristics**:
- Thin layer focused on presentation
- No business logic
- Handles HTTP-specific concerns
- Maps external requests to application services
- Implements security measures (CSP, CORS)

### 2. Application Layer (`src/application/`)

**Purpose**: Orchestrate domain objects and infrastructure services to implement use cases.

**Responsibilities**:
- Use case implementation
- Transaction management
- Coordination between domain objects
- Application-specific business rules
- Workflow orchestration
- Authorization and authentication coordination

**Dependencies**:
- Can depend on Domain Layer
- Can depend on Infrastructure Layer (through interfaces)

**Examples**:
```typescript
// Application Module
@Module({
  imports: [ApiModule, LoggerModule, ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

// Authorization Service
@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(UsersInterfaceSymbol)
    private readonly users: UsersInterface,
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface,
  ) {}
  
  // Authorization logic
}
```

**Key Characteristics**:
- Contains application-specific logic
- Orchestrates domain objects
- Manages transactions and workflows
- Implements use cases
- Handles cross-cutting concerns

### 3. Domain Layer (`src/domain/`)

**Purpose**: Contain the core business logic and domain knowledge.

**Responsibilities**:
- Business entities and value objects
- Domain services
- Business rules and invariants
- Domain interfaces (repositories, services) with symbols
- Domain events
- Specifications for complex business rules

**Dependencies**:
- No dependencies on other layers
- Defines interfaces with symbols that other layers implement

**Examples**:
```typescript
// Domain Entity
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

// Domain Interface with Symbol
export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}

export const TasksInterfaceSymbol = Symbol('TasksInterface');

// Domain Service
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
}

// Domain Facade
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
}

// Specification Pattern
export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
```

**Key Characteristics**:
- Pure business logic
- No technical concerns
- Self-contained and testable
- Defines contracts with symbols for other layers
- Enforces business invariants

### 4. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Implement technical concerns and external integrations.

**Responsibilities**:
- Database access and persistence
- External service integrations
- Configuration management with validation
- Logging and monitoring
- Security implementations
- Cross-cutting concerns
- Sanitization and validation services

**Dependencies**:
- Implements Domain Layer interfaces
- Can depend on other Infrastructure Layer components

**Examples**:
```typescript
// Database Module
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (databaseConfig: DatabaseConfig) => ({
        type: "postgres",
        host: databaseConfig.host,
        port: databaseConfig.port,
        username: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database,
        entities: [__dirname + "/entities/**/*.entity{.ts,.js}"],
        migrations: ["dist/infrastructure/database/migrations/*{.ts,.js}"],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [DatabaseConfig],
    }),
  ],
})
export class DatabaseModule {}

// Domain Repository Implementation
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

// Configuration Module with Deep Freezing
@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OrderingConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OrderingConfig],
})
export class ConfigModule {}

// JWT Service (Adapter Pattern)
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

// Sanitization Service
@Injectable()
export class SanitizationService {
  public sanitizeString(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
}
```

**Key Characteristics**:
- Implements technical concerns
- Provides concrete implementations of domain interfaces
- Handles external integrations
- Manages configuration and cross-cutting concerns
- Implements security measures

## Dependency Rules

### Strict Dependency Direction

1. **Interface Layer** → **Application Layer** → **Domain Layer**
2. **Infrastructure Layer** → **Domain Layer** (implements interfaces)
3. **No upward dependencies** from lower layers to higher layers

### Dependency Inversion Principle

- Domain Layer defines interfaces with symbols
- Infrastructure Layer implements these interfaces
- Application Layer depends on abstractions, not concretions
- Symbol-based injection ensures type safety

```typescript
// Domain defines the interface with symbol
export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;
  nowAsSecondsSinceEpoch(): number;
}

export const ClockInterfaceSymbol = Symbol('ClockInterface');

// Infrastructure implements the interface
@Injectable()
export class ClockService implements ClockInterface {
  nowAsSecondsSinceEpoch(): number {
    return Math.floor(Date.now() / 1000);
  }
  nowAsMillisecondsSinceEpoch(): number {
    return Date.now();
  }
}

// Module provides the symbol
@Module({
  providers: [
    {
      provide: ClockInterfaceSymbol,
      useClass: ClockService,
    },
  ],
  exports: [ClockInterfaceSymbol],
})
export class ClockModule {}

// Application uses the interface through symbol injection
@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(ClockInterfaceSymbol)
    private readonly clock: ClockInterface, // Depends on interface, not implementation
  ) {}
}
```

## Module Organization

### NestJS Module Structure

Each layer is organized into NestJS modules that follow the layered architecture:

```typescript
// Application Module (Root)
@Module({
  imports: [ApiModule, LoggerModule, ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

// Interface Layer Module
@Module({
  imports: [StatusModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}

// Infrastructure Layer Modules
@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OrderingConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OrderingConfig],
})
export class ConfigModule {}

// Domain Repository Module
@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])],
  providers: [
    {
      provide: TasksInterfaceSymbol,
      useClass: TasksDomainRepository,
    },
  ],
  exports: [TasksInterfaceSymbol],
})
export class TasksDomainRepositoryModule {}
```

## Configuration Management

### Configuration Objects

Configuration is managed through validated, deeply frozen objects:

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

## Security Implementation

### Input Sanitization

All user input is sanitized to prevent XSS attacks:

```typescript
@Injectable()
export class SanitizationService {
  public sanitizeString(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
}
```

### Value Object Validation

Value objects validate input at domain boundaries:

```typescript
export class DescriptionValue {
  private constructor(public readonly description: string) {
    Assert(description.length > 0, "Description cannot be empty");
    Assert(description.length <= 1000, "Description too long");
  }

  public static fromString(description: string): DescriptionValue {
    return new DescriptionValue(description);
  }
}
```

## Benefits of Layered Architecture

### 1. Separation of Concerns
- Each layer has a single, well-defined responsibility
- Business logic is isolated from technical concerns
- Changes in one layer don't affect others

### 2. Testability
- Domain logic can be tested in isolation
- Infrastructure can be mocked or replaced
- Each layer can be tested independently

### 3. Maintainability
- Clear structure makes code easy to understand
- Changes are localized to specific layers
- Dependencies are explicit and controlled

### 4. Flexibility
- Infrastructure can be swapped without affecting business logic
- New interfaces can be added without changing existing code
- Technology choices can be changed independently

### 5. Scalability
- Layers can be scaled independently
- New features can be added without affecting existing code
- Team members can work on different layers simultaneously

### 6. Type Safety
- Symbol-based injection ensures compile-time type checking
- Interface contracts are enforced at the type level
- Refactoring is safer with TypeScript support

## Trade-offs

### 1. Complexity
- Additional abstraction layers increase complexity
- More files and modules to manage
- Steeper learning curve for new team members

### 2. Performance
- Additional abstraction layers may introduce overhead
- More method calls and object creation
- Potential for over-abstraction

### 3. Development Speed
- More boilerplate code required
- Strict rules may slow down initial development
- Requires discipline to maintain layer boundaries

### 4. Symbol Management
- Need to manage symbols for all interfaces
- Additional complexity in module configuration
- Potential for symbol naming conflicts

## Best Practices

### 1. Layer Boundaries
- Never bypass layer boundaries
- Always go through the proper layer interfaces
- Keep layer responsibilities clear and focused

### 2. Dependency Management
- Use symbol-based dependency injection for loose coupling
- Implement interfaces in infrastructure layer
- Keep domain layer pure and independent

### 3. Testing Strategy
- Test each layer independently
- Use in-memory implementations for domain testing
- Mock infrastructure dependencies in application tests

### 4. Error Handling
- Handle technical errors in infrastructure layer
- Convert to domain errors when crossing layer boundaries
- Provide meaningful error messages to interface layer

### 5. Configuration Management
- Use validated configuration objects
- Implement deep freezing for configuration immutability
- Centralize configuration validation

### 6. Security Implementation
- Sanitize all user input
- Validate at domain boundaries
- Implement security headers and policies

## Conclusion

The layered architecture in this codebase provides a solid foundation for building maintainable, testable, and scalable applications. By following strict dependency rules and clear separation of concerns, the codebase achieves high cohesion and low coupling, making it easier to understand, modify, and extend over time. The addition of symbol-based dependency injection, comprehensive configuration management, and security measures ensures the architecture is both robust and secure.
