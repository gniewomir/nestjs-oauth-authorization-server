# CSRF Protection Implementation

## Overview

This document describes the CSRF (Cross-Site Request Forgery) protection implementation for the OAuth application.

## What is CSRF?

CSRF is an attack where a malicious website tricks a user's browser into making unwanted requests to a site where the user is authenticated. The attack exploits the browser's automatic sending of cookies and authentication tokens.

## Implementation Details

### 1. CSRF Service (`src/infrastructure/security/csrf/csrf.service.ts`)

The CSRF service provides:
- **Token Generation**: Creates cryptographically secure tokens for each OAuth request
- **Token Validation**: Validates tokens against stored values
- **Token Expiration**: Tokens expire after 5 minutes to prevent long-term attacks
- **Replay Protection**: Tokens are single-use and removed after validation

Key features:
- Uses `crypto.randomBytes(32)` for secure token generation
- Tokens are 64-character hexadecimal strings
- Automatic cleanup of expired tokens
- Thread-safe token storage using Map

### 2. CSRF Middleware (`src/infrastructure/security/csrf/csrf.middleware.ts`)

The middleware:
- Intercepts POST requests to `/oauth/prompt`
- Validates CSRF tokens in request body
- Throws `BadRequestException` for invalid/missing tokens
- Allows all other requests to pass through

### 3. OAuth Controller Integration

The OAuth controller has been updated to:
- Generate CSRF tokens for each authorization request
- Include CSRF tokens in form hidden fields
- Validate tokens through middleware before processing

### 4. DTO Updates

The `PromptRequestDto` has been updated to include:
- `_csrf: string` - Required CSRF token field
- `action?: string` - Optional action field for registration forms

## Security Features

### 1. Token Security
- **Cryptographic Strength**: 256-bit random tokens
- **Expiration**: 5-minute TTL prevents long-term attacks
- **Single-Use**: Tokens are consumed upon validation
- **Request-Specific**: Each OAuth request gets a unique token

### 2. Attack Prevention
- **CSRF Attacks**: Prevents unauthorized form submissions
- **Replay Attacks**: Single-use tokens prevent token reuse
- **Timing Attacks**: Token expiration limits attack window
- **Brute Force**: 256-bit tokens make brute force impractical

### 3. Implementation Security
- **Type Safety**: Full TypeScript type checking
- **Input Validation**: Proper validation of all inputs
- **Error Handling**: Clear error messages without information leakage
- **Middleware Isolation**: CSRF protection only on sensitive endpoints

## Usage

### 1. Token Generation
```typescript
// In OAuth controller
const csrfToken = this.csrfService.generateToken(requestId);
```

### 2. Form Integration
```typescript
// Add to form hidden fields
formHiddenFields: [
  { name: "request_id", value: requestId },
  { name: "_csrf", value: csrfToken },
]
```

### 3. Validation
```typescript
// Automatic validation in middleware
// Throws BadRequestException if invalid
```

## Testing

### 1. Service Tests (`csrf.service.spec.ts`)
- Token generation uniqueness
- Token validation logic
- Expiration handling
- Replay attack prevention
- Cleanup functionality

### 2. Middleware Tests (`csrf.middleware.spec.ts`)
- Valid token acceptance
- Invalid token rejection
- Missing token handling
- Route-specific protection
- Error message validation

## Configuration

### 1. Module Registration
```typescript
// In OauthApiModule
imports: [CsrfModule]

// In AppModule
consumer.apply(CsrfMiddleware).forRoutes("/oauth/prompt");
```

### 2. Token Expiration
```typescript
// Configurable in CsrfService
private readonly tokenExpirationSeconds = 300; // 5 minutes
```

## Security Considerations

### 1. Token Storage
- Tokens are stored in memory (Map)
- No persistence to prevent database attacks
- Automatic cleanup prevents memory leaks

### 2. Token Distribution
- Tokens are included in HTML forms
- No cookies required (stateless approach)
- Works with any client implementation

### 3. Error Handling
- Generic error messages prevent information leakage
- No token details exposed in error responses
- Proper HTTP status codes (400 Bad Request)

## Integration Points

### 1. OAuth Flow
- Authorization request creation
- User consent forms
- Registration forms
- Token exchange endpoints

### 2. Form Handling
- Login forms
- Registration forms
- Authorization consent forms
- Denial forms

### 3. Error Handling
- Invalid token responses
- Missing token responses
- Expired token handling

## Future Enhancements

### 1. Additional Protection
- SameSite cookie attributes
- Custom request headers
- Double-submit cookie pattern

### 2. Monitoring
- Token usage metrics
- Attack detection
- Performance monitoring

### 3. Configuration
- Configurable token expiration
- Multiple token algorithms
- Token rotation policies

## Compliance

This implementation provides:
- **OWASP CSRF Protection**: Follows OWASP guidelines
- **Security Best Practices**: Industry-standard security measures
- **Audit Trail**: Clear validation and error handling
- **Maintainability**: Well-tested and documented code
