# Layered Architecture

## Overview

This codebase implements a strict **Layered Architecture** pattern with clear separation of concerns across four distinct layers. Each layer has specific responsibilities and dependencies, following the Dependency Inversion Principle.

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

### 2. Application Layer (`src/application/`)

**Purpose**: Orchestrate domain objects and infrastructure services to implement use cases.

**Responsibilities**:
- Use case implementation
- Transaction management
- Coordination between domain objects
- Application-specific business rules
- Workflow orchestration

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
```

**Key Characteristics**:
- Contains application-specific logic
- Orchestrates domain objects
- Manages transactions and workflows
- Implements use cases

### 3. Domain Layer (`src/domain/`)

**Purpose**: Contain the core business logic and domain knowledge.

**Responsibilities**:
- Business entities and value objects
- Domain services
- Business rules and invariants
- Domain interfaces (repositories, services)
- Domain events

**Dependencies**:
- No dependencies on other layers
- Defines interfaces that other layers implement

**Examples**:
```typescript
// Domain Entity
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

  public async moveBefore(
    referenceEntityIdentity: IdentityValue,
    orderingService: OrderService<TasksInterface>,
  ): Promise<void> {
    this._ordinalNumber = await orderingService.nextAvailableOrdinalNumber(
      referenceEntityIdentity,
    );
  }
}

// Domain Interface
export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}

// Domain Service
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
```

**Key Characteristics**:
- Pure business logic
- No technical concerns
- Self-contained and testable
- Defines contracts for other layers

### 4. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Implement technical concerns and external integrations.

**Responsibilities**:
- Database access and persistence
- External service integrations
- Configuration management
- Logging and monitoring
- Security implementations
- Cross-cutting concerns

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
export class TasksDomainRepository implements TasksInterface {
  persist(_task: Task): Promise<void> {
    throw new Error("Method not implemented.");
  }

  retrieve(_identity: IdentityValue): Promise<Task> {
    throw new Error("Method not implemented.");
  }
}

// Configuration Module
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

**Key Characteristics**:
- Implements technical concerns
- Provides concrete implementations of domain interfaces
- Handles external integrations
- Manages configuration and cross-cutting concerns

## Dependency Rules

### Strict Dependency Direction

1. **Interface Layer** → **Application Layer** → **Domain Layer**
2. **Infrastructure Layer** → **Domain Layer** (implements interfaces)
3. **No upward dependencies** from lower layers to higher layers

### Dependency Inversion Principle

- Domain Layer defines interfaces
- Infrastructure Layer implements these interfaces
- Application Layer depends on abstractions, not concretions

```typescript
// Domain defines the interface
export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;
  nowAsSecondsSinceEpoch(): number;
}

// Infrastructure implements the interface
export class ClockService implements ClockInterface {
  nowAsSecondsSinceEpoch(): number {
    return Math.floor(Date.now() / 1000);
  }
  nowAsMillisecondsSinceEpoch(): number {
    return Date.now();
  }
}

// Application uses the interface
export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface, // Depends on interface, not implementation
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    // Implementation
  }
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

## Best Practices

### 1. Layer Boundaries
- Never bypass layer boundaries
- Always go through the proper layer interfaces
- Keep layer responsibilities clear and focused

### 2. Dependency Management
- Use dependency injection for loose coupling
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

## Conclusion

The layered architecture in this codebase provides a solid foundation for building maintainable, testable, and scalable applications. By following strict dependency rules and clear separation of concerns, the codebase achieves high cohesion and low coupling, making it easier to understand, modify, and extend over time.
