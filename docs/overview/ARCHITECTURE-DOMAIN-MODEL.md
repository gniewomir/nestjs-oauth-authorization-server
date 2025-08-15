# Domain Model

## Overview

The domain model represents the core business concepts and rules of the task management system with OAuth authentication capabilities. It is designed using Domain-Driven Design principles to capture the essential business knowledge and ensure that business rules are enforced at the domain level.

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
- `orderKey`: Position in the task ordering system using LexoRank-style string keys

**Business Rules**:
- Every task must have a description
- Every task must be assigned to someone
- Every task must contribute to a goal
- Every task must have a context where it can be performed
- Tasks have a specific order that can be changed using LexoRank-style ordering
- Task descriptions are sanitized to prevent XSS attacks

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

#### Goal Entity

**Purpose**: Represents a general outcome that can be achieved by completing multiple tasks.

**Properties**:
- `identity`: Unique identifier for the goal
- `description`: Human-readable description of the desired outcome
- `orderKey`: Position in the goal ordering system using LexoRank-style string keys

**Business Rules**:
- Goals can be archived by completing enough tasks
- Goals have a specific order that can be changed using LexoRank-style ordering
- Goals provide context and motivation for tasks

```typescript
export class Goal extends OrderedEntity<GoalsInterface> {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: IdentityValue;
    orderKey: string;
  }) {
    super({
      assigned: parameters.assigned,
    });

    this.identity = parameters.identity;
    this.description = parameters.description;
    this._orderKey = parameters.orderKey;
  }

  public get orderKey(): string {
    return this._orderKey;
  }
}
```

#### Context Entity

**Purpose**: Represents a combination of time, place, and availability that makes tasks doable.

**Properties**:
- `identity`: Unique identifier for the context
- `description`: Human-readable description of the context
- `orderKey`: Position in the context ordering system using LexoRank-style string keys

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
export class Context extends OrderedEntity<ContextsInterface> {
  public readonly identity: IdentityValue;
  public readonly description: DescriptionValue;

  constructor(parameters: {
    identity: IdentityValue;
    description: DescriptionValue;
    assigned: IdentityValue;
    orderKey: string;
  }) {
    super({
      assigned: parameters.assigned,
    });

    this.identity = parameters.identity;
    this.description = parameters.description;
    this._orderKey = parameters.orderKey;
  }

  public get orderKey(): string {
    return this._orderKey;
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
- Passwords must be properly hashed and validated

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

  public get refreshTokens(): RefreshTokenValue[] {
    return [...this._refreshTokens];
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
- Redirect URIs must be valid HTTP URLs

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

#### Request Entity

**Purpose**: Represents an OAuth authorization request during the PKCE flow.

**Properties**:
- `id`: Unique identifier for the request
- `clientId`: Identifier of the requesting client
- `redirectUri`: Redirect URI for the authorization response
- `scope`: Requested permissions and access levels
- `state`: CSRF protection token
- `codeChallenge`: PKCE code challenge for security
- `authorizationCode`: Generated authorization code (nullable)

**Business Rules**:
- Requests must be associated with a valid client
- Redirect URI must match the client's registered URI
- State parameter provides CSRF protection
- Code challenge implements PKCE security
- Authorization codes are single-use and time-limited

```typescript
export class Request {
  public readonly id: IdentityValue;
  public readonly clientId: IdentityValue;
  public readonly redirectUri: HttpUrlValue;
  public readonly scope: ScopeValueImmutableSet;
  public readonly state: string;
  public readonly codeChallenge: string;
  public authorizationCode: string | null;

  constructor(parameters: {
    id: IdentityValue;
    clientId: IdentityValue;
    redirectUri: HttpUrlValue;
    scope: ScopeValueImmutableSet;
    state: string;
    codeChallenge: string;
    authorizationCode: string | null;
  }) {
    this.id = parameters.id;
    this.clientId = parameters.clientId;
    this.redirectUri = parameters.redirectUri;
    this.scope = parameters.scope;
    this.state = parameters.state;
    this.codeChallenge = parameters.codeChallenge;
    this.authorizationCode = parameters.authorizationCode;
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

  public toString(): string {
    return this.identity;
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
- Sanitized to prevent XSS attacks

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

### HttpUrlValue

**Purpose**: Represents a valid HTTP URL.

**Properties**:
- `url`: String representation of the URL

**Business Rules**:
- Must be a valid HTTP/HTTPS URL
- Immutable once created
- Used for redirect URIs and external links

```typescript
export class HttpUrlValue {
  private constructor(public readonly url: string) {
    Assert(isURL(url, { protocols: ['http', 'https'] }));
  }

  public static fromString(url: string): HttpUrlValue {
    return new HttpUrlValue(url);
  }

  public toString(): string {
    return this.url;
  }
}
```

### ScopeValue

**Purpose**: Represents OAuth scopes and permissions.

**Properties**:
- `scope`: String representation of the scope

**Business Rules**:
- Must be a valid scope format
- Immutable once created
- Used for authorization and access control

```typescript
export class ScopeValue {
  private constructor(public readonly scope: string) {
    Assert(scope.length > 0, "Scope cannot be empty");
  }

  public static TASK_API(): ScopeValue {
    return new ScopeValue("task:api");
  }

  public static TOKEN_AUTHENTICATE(): ScopeValue {
    return new ScopeValue("token:authenticate");
  }

  public static fromString(scope: string): ScopeValue {
    return new ScopeValue(scope);
  }

  public toString(): string {
    return this.scope;
  }
}
```

### ScopeValueImmutableSet

**Purpose**: Represents an immutable set of OAuth scopes.

**Properties**:
- `scopes`: Set of scope values

**Business Rules**:
- Immutable collection of scopes
- No duplicate scopes allowed
- Used for managing multiple permissions

```typescript
export class ScopeValueImmutableSet {
  private constructor(private readonly scopes: Set<ScopeValue>) {}

  public static fromArray(scopes: ScopeValue[]): ScopeValueImmutableSet {
    return new ScopeValueImmutableSet(new Set(scopes));
  }

  public static fromString(scopesString: string): ScopeValueImmutableSet {
    const scopes = scopesString.split(' ').map(ScopeValue.fromString);
    return ScopeValueImmutableSet.fromArray(scopes);
  }

  public toArray(): ScopeValue[] {
    return Array.from(this.scopes);
  }

  public toString(): string {
    return Array.from(this.scopes).map(s => s.toString()).join(' ');
  }

  public has(scope: ScopeValue): boolean {
    return this.scopes.has(scope);
  }
}
```

## Domain Services

### OrderService

**Purpose**: Manages the ordering of entities using LexoRank-style string-based ordering.

**Responsibilities**:
- Calculate new order keys for entities
- Handle task reordering operations
- Maintain proper spacing between ordered items
- Implement efficient LexoRank-style ordering algorithms

**Business Rules**:
- Uses LexoRank-style string-based ordering to avoid frequent reordering
- Calculates optimal positions for moved items
- Handles edge cases like first and last positions
- Maintains consistent ordering across all ordered entities

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

export const TasksInterfaceSymbol = Symbol('TasksInterface');
```

#### UsersInterface

```typescript
export interface UsersInterface {
  retrieve(identity: IdentityValue): Promise<User>;
  persist(user: User): Promise<void>;
  countByEmail(email: EmailValue): Promise<number>;
}

export const UsersInterfaceSymbol = Symbol('UsersInterface');
```

#### GoalsInterface

```typescript
export interface GoalsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Goal>;
  persist(goal: Goal): Promise<void>;
}

export const GoalsInterfaceSymbol = Symbol('GoalsInterface');
```

#### ContextsInterface

```typescript
export interface ContextsInterface extends OrderInterface {
  retrieve(identity: IdentityValue): Promise<Context>;
  persist(context: Context): Promise<void>;
}

export const ContextsInterfaceSymbol = Symbol('ContextsInterface');
```

#### OrderInterface

```typescript
export interface OrderInterface {
  getOrderKey(identity: IdentityValue): Promise<string>;
  searchForLowerOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null>;
  searchForHigherOrderKey(
    assignedIdentity: IdentityValue,
    orderKey: string,
  ): Promise<string | null>;
  searchForHighestOrderKey(
    assignedIdentity: IdentityValue,
  ): Promise<string | null>;
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

export const ClockInterfaceSymbol = Symbol('ClockInterface');
```

#### TokenPayloadInterface

```typescript
export interface TokenPayloadInterface {
  verify(token: string): Promise<TokenPayload>;
  sign(tokenPayload: Record<string, unknown>): Promise<string>;
}

export const TokenPayloadInterfaceSymbol = Symbol('TokenPayloadInterface');
```

## Business Rules and Invariants

### Task Management Rules

1. **Task Assignment**: Every task must be assigned to a person
2. **Task Context**: Every task must have a context where it can be performed
3. **Task Goal**: Every task must contribute to a goal
4. **Task Ordering**: Tasks have a specific order that can be changed using LexoRank-style ordering
5. **Task Description**: Every task must have a meaningful description
6. **Input Sanitization**: All user input must be sanitized to prevent XSS attacks

### Authentication Rules

1. **Email Uniqueness**: Email addresses must be unique across all users
2. **Token Validation**: JWT tokens must have valid issuers and not be expired
3. **Scope Validation**: Tokens must have appropriate scopes for operations
4. **Refresh Token Management**: Refresh tokens are managed per client and user
5. **Password Security**: Passwords must be properly hashed and validated
6. **OAuth Security**: PKCE flow must be used for authorization code flow

### Ordering Rules

1. **LexoRank-style Ordering**: Uses string-based LexoRank-style ordering to minimize reordering overhead
2. **Position Calculation**: Calculates optimal positions for moved items
3. **Boundary Handling**: Properly handles first and last positions
4. **Consistency**: Maintains consistent ordering across all ordered entities
5. **Performance**: Optimized for read and write operations

### Security Rules

1. **Input Validation**: All external input must be validated at domain boundaries
2. **XSS Prevention**: User input must be sanitized before storage
3. **CSRF Protection**: State parameters must be used in OAuth flows
4. **Token Security**: Access tokens stored in memory, refresh tokens in HTTP-only cookies
5. **URL Validation**: All URLs must be validated and use HTTPS in production

## Domain Events

### Potential Domain Events

While not currently implemented, the domain model could benefit from domain events:

1. **TaskCreated**: When a new task is created
2. **TaskMoved**: When a task is reordered
3. **TaskCompleted**: When a task is marked as complete
4. **UserRegistered**: When a new user registers
5. **TokenRefreshed**: When authentication tokens are refreshed
6. **OAuthRequestCreated**: When an OAuth authorization request is created
7. **EmailVerified**: When a user's email is verified

## Benefits of This Domain Model

### 1. Business Focus

- Captures essential business concepts
- Enforces business rules at the domain level
- Provides clear business vocabulary

### 2. Maintainability

- Clear separation of concerns
- Well-defined interfaces with symbols
- Easy to understand and modify

### 3. Testability

- Pure business logic
- No external dependencies
- Easy to test in isolation

### 4. Flexibility

- Can evolve with business requirements
- Supports multiple implementation strategies
- Allows for future extensions

### 5. Security

- Built-in security measures
- Input validation and sanitization
- Secure authentication patterns

### 6. Performance

- Efficient LexoRank-style ordering algorithms
- Optimized data structures
- Minimal reordering overhead

## Conclusion

The domain model provides a solid foundation for the task management system with OAuth authentication by capturing the essential business concepts and rules. It follows Domain-Driven Design principles to ensure that business logic is centralized, well-organized, and easy to understand. The model supports the layered architecture by providing clear contracts with symbols for other layers to implement, while maintaining independence from technical concerns. The addition of security measures, efficient LexoRank-style ordering systems, and comprehensive OAuth support ensures the domain model is both robust and secure.
