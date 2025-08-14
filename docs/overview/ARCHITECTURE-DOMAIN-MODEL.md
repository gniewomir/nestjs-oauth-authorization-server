# Domain Model

## Overview

The domain model represents the core business concepts and rules of the task management system. It is designed using Domain-Driven Design principles to capture the essential business knowledge and ensure that business rules are enforced at the domain level.

## Core Domain Concepts

### 1. Task Management Context

#### Task Entity

**Purpose**: Represents a specific activity with a clearly defined outcome.

**Properties**:
- `identity`: Unique identifier for the task
- `description`: Human-readable description of what needs to be done
- `assigned`: Person responsible for completing the task
- `goal`: The broader objective this task contributes to
- `context`: The environment or situation where the task can be performed
- `ordinalNumber`: Position in the task ordering system

**Business Rules**:
- Every task must have a description
- Every task must be assigned to someone
- Every task must contribute to a goal
- Every task must have a context where it can be performed
- Tasks have a specific order that can be changed

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
    this.identity = parameters.identity;
    this.description = parameters.description;
    this.assigned = parameters.assigned;
    this.goal = parameters.goal;
    this.context = parameters.context;
    this._ordinalNumber = parameters.ordinalNumber;
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
```

#### Goal Entity

**Purpose**: Represents a general outcome that can be achieved by completing multiple tasks.

**Properties**:
- `identity`: Unique identifier for the goal
- `description`: Human-readable description of the desired outcome
- `ordinalNumber`: Position in the goal ordering system

**Business Rules**:
- Goals can be archived by completing enough tasks
- Goals have a specific order that can be changed
- Goals provide context and motivation for tasks

```typescript
export class Goal {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    ordinalNumber: number;
  }) {
    this.identity = parameters.identity;
    this.description = parameters.description;
    this._ordinalNumber = parameters.ordinalNumber;
  }
}
```

#### Context Entity

**Purpose**: Represents a combination of time, place, and availability that makes tasks doable.

**Properties**:
- `identity`: Unique identifier for the context
- `description`: Human-readable description of the context
- `ordinalNumber`: Position in the context ordering system

**Business Rules**:
- Contexts define where and when tasks can be performed
- Tasks can only be done in appropriate contexts
- Contexts help filter and organize tasks

**Examples**:
- "At home in the morning before work"
- "At the gym with equipment available"
- "At the office during business hours"
- "When I have internet access"

```typescript
export class Context {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    ordinalNumber: number;
  }) {
    this.identity = parameters.identity;
    this.description = parameters.description;
    this._ordinalNumber = parameters.ordinalNumber;
  }
}
```

#### Assigned Entity

**Purpose**: Represents the person responsible for completing a task.

**Properties**:
- `identity`: Unique identifier for the assigned person
- `name`: Human-readable name of the person

**Business Rules**:
- Every task must have an assigned person
- The assigned person is responsible for task completion

```typescript
export class Assigned {
  public readonly identity: IdentityValue;
  public readonly name: string;

  constructor(parameters: {
    identity: IdentityValue;
    name: string;
  }) {
    this.identity = parameters.identity;
    this.name = parameters.name;
  }
}
```

### 2. Authentication Context

#### User Entity

**Purpose**: Represents a user of the system with authentication and authorization capabilities.

**Properties**:
- `identity`: Unique identifier for the user
- `email`: User's email address (used for authentication)
- `emailVerified`: Whether the email has been verified
- `password`: Hashed password for authentication
- `refreshTokens`: List of active refresh tokens for different clients

**Business Rules**:
- Email addresses must be unique across all users
- Email addresses must be verified before certain operations
- Users can have multiple active refresh tokens for different clients
- Refresh tokens expire and must be managed

```typescript
export class User {
  public readonly identity: IdentityValue;
  public readonly email: EmailValue;
  public readonly emailVerified: boolean;
  public readonly password: string;
  private _refreshTokens: RefreshTokenValue[];

  constructor(parameters: {
    identity: IdentityValue;
    email: EmailValue;
    emailVerified: boolean;
    password: string;
    refreshTokens: RefreshTokenValue[];
  }) {
    this.identity = parameters.identity;
    this.email = parameters.email;
    this.emailVerified = parameters.emailVerified;
    this.password = parameters.password;
    this._refreshTokens = parameters.refreshTokens;
  }

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

  public rotateRefreshToken(
    refreshToken: RefreshTokenValue,
    clock: ClockInterface,
  ): void {
    const nonExpired = this._refreshTokens.filter(
      (token) => token.exp > clock.nowAsSecondsSinceEpoch(),
    );
    const onlyOtherClients = nonExpired.filter(
      (token) => refreshToken.aud !== token.aud,
    );
    const clients = new Map(
      onlyOtherClients.map((token) => [token.aud, token]),
    );
    clients.set(refreshToken.aud, RefreshTokenValue.fromUnknown(refreshToken));
    this._refreshTokens = Array.from(clients.values());
  }

  public hasRefreshToken(jti: IdentityValue, clock: ClockInterface): boolean {
    const validRefreshToken = this._refreshTokens.find(
      (refreshToken) =>
        IdentityValue.fromString(refreshToken.jti).isEqual(jti) &&
        refreshToken.exp > clock.nowAsSecondsSinceEpoch(),
    );
    return validRefreshToken !== undefined;
  }

  public spendRefreshToken(jti: IdentityValue) {
    this._refreshTokens = this._refreshTokens.filter(
      (token) => token.jti !== jti.toString(),
    );
  }
}
```

#### Client Entity

**Purpose**: Represents an OAuth client application that can authenticate users.

**Properties**:
- `identity`: Unique identifier for the client
- `name`: Human-readable name of the client application
- `redirectUri`: Allowed redirect URI for OAuth flows

**Business Rules**:
- Clients must be registered before they can authenticate users
- Each client has its own set of refresh tokens
- Clients are responsible for managing their own OAuth flows

```typescript
export class Client {
  public readonly identity: IdentityValue;
  public readonly name: string;
  public readonly redirectUri: HttpUrlValue;

  constructor(parameters: {
    identity: IdentityValue;
    name: string;
    redirectUri: HttpUrlValue;
  }) {
    this.identity = parameters.identity;
    this.name = parameters.name;
    this.redirectUri = parameters.redirectUri;
  }
}
```

## Value Objects

### IdentityValue

**Purpose**: Represents a unique identifier for domain entities.

**Properties**:
- `identity`: String representation of the UUID

**Business Rules**:
- Must be a valid UUID v4
- Immutable once created
- Equality based on value comparison

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

### EmailValue

**Purpose**: Represents a valid email address.

**Properties**:
- `email`: String representation of the email

**Business Rules**:
- Must be a valid email format
- Immutable once created
- Used for user identification and communication

```typescript
export class EmailValue {
  private constructor(public readonly email: string) {
    Assert(isEmail(email));
  }

  public static fromString(email: string): EmailValue {
    return new EmailValue(email);
  }

  public toString(): string {
    return this.email;
  }
}
```

### DescriptionValue

**Purpose**: Represents a human-readable description.

**Properties**:
- `description`: String representation of the description

**Business Rules**:
- Must not be empty
- Must have reasonable length limits
- Immutable once created

```typescript
export class DescriptionValue {
  private constructor(public readonly description: string) {
    Assert(description.length > 0, "Description cannot be empty");
    Assert(description.length <= 1000, "Description too long");
  }

  public static fromString(description: string): DescriptionValue {
    return new DescriptionValue(description);
  }

  public toString(): string {
    return this.description;
  }
}
```

## Domain Services

### OrderService

**Purpose**: Manages the ordering of entities using spaced integer indexing.

**Responsibilities**:
- Calculate new ordinal numbers for entities
- Handle task reordering operations
- Maintain proper spacing between ordered items

**Business Rules**:
- Uses spaced integer indexing to avoid frequent reordering
- Calculates optimal positions for moved items
- Handles edge cases like first and last positions

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

### AuthenticationFacade

**Purpose**: Provides a simplified interface for complex authentication operations.

**Responsibilities**:
- Authenticate users with JWT tokens
- Refresh authentication tokens
- Validate token scopes and permissions
- Manage token lifecycle

**Business Rules**:
- Tokens must have valid issuers
- Tokens must not be expired
- Tokens must have appropriate scopes
- Refresh tokens must be managed per client

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
    // Complex refresh logic implementation
  }
}
```

## Specifications

### UniqueEmailSpecification

**Purpose**: Encapsulates the business rule that email addresses must be unique.

**Responsibilities**:
- Check if an email address is already in use
- Provide a reusable way to validate email uniqueness

```typescript
export class UniqueEmailSpecification {
  constructor(private readonly users: UsersInterface) {}

  public async isSatisfied(email: EmailValue): Promise<boolean> {
    const count = await this.users.countByEmail(email);
    return count === 0;
  }
}
```

## Domain Interfaces

### Repository Interfaces

**Purpose**: Define contracts for data access without specifying implementation details.

#### TasksInterface

```typescript
export interface TasksInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Task>;
  persist(task: Task): Promise<void>;
}
```

#### UsersInterface

```typescript
export interface UsersInterface {
  retrieve(identity: IdentityValue): Promise<User>;
  persist(user: User): Promise<void>;
  countByEmail(email: EmailValue): Promise<number>;
}
```

#### GoalsInterface

```typescript
export interface GoalsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Goal>;
  persist(goal: Goal): Promise<void>;
}
```

#### ContextsInterface

```typescript
export interface ContextsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Context>;
  persist(context: Context): Promise<void>;
}
```

### Service Interfaces

**Purpose**: Define contracts for domain services.

#### ClockInterface

```typescript
export interface ClockInterface {
  nowAsMillisecondsSinceEpoch(): number;
  nowAsSecondsSinceEpoch(): number;
}
```

#### TokenPayloadInterface

```typescript
export interface TokenPayloadInterface {
  verify(token: string): Promise<TokenPayload>;
  sign(tokenPayload: Record<string, unknown>): Promise<string>;
}
```

## Business Rules and Invariants

### Task Management Rules

1. **Task Assignment**: Every task must be assigned to a person
2. **Task Context**: Every task must have a context where it can be performed
3. **Task Goal**: Every task must contribute to a goal
4. **Task Ordering**: Tasks have a specific order that can be changed
5. **Task Description**: Every task must have a meaningful description

### Authentication Rules

1. **Email Uniqueness**: Email addresses must be unique across all users
2. **Token Validation**: JWT tokens must have valid issuers and not be expired
3. **Scope Validation**: Tokens must have appropriate scopes for operations
4. **Refresh Token Management**: Refresh tokens are managed per client and user
5. **Password Security**: Passwords must be properly hashed and validated

### Ordering Rules

1. **Spaced Indexing**: Uses spaced integer indexing to minimize reordering
2. **Position Calculation**: Calculates optimal positions for moved items
3. **Boundary Handling**: Properly handles first and last positions
4. **Consistency**: Maintains consistent ordering across all ordered entities

## Domain Events

### Potential Domain Events

While not currently implemented, the domain model could benefit from domain events:

1. **TaskCreated**: When a new task is created
2. **TaskMoved**: When a task is reordered
3. **TaskCompleted**: When a task is marked as complete
4. **UserRegistered**: When a new user registers
5. **TokenRefreshed**: When authentication tokens are refreshed

## Benefits of This Domain Model

### 1. Business Focus

- Captures essential business concepts
- Enforces business rules at the domain level
- Provides clear business vocabulary

### 2. Maintainability

- Clear separation of concerns
- Well-defined interfaces
- Easy to understand and modify

### 3. Testability

- Pure business logic
- No external dependencies
- Easy to test in isolation

### 4. Flexibility

- Can evolve with business requirements
- Supports multiple implementation strategies
- Allows for future extensions

## Conclusion

The domain model provides a solid foundation for the task management system by capturing the essential business concepts and rules. It follows Domain-Driven Design principles to ensure that business logic is centralized, well-organized, and easy to understand. The model supports the layered architecture by providing clear contracts for other layers to implement, while maintaining independence from technical concerns.
