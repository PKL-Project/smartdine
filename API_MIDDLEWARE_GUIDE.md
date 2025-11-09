# API Middleware & Authorization Guide

## Overview

This project now uses type-safe, reusable middleware for authentication and authorization across all API routes. The middleware eliminates repetitive code, removes `any` types, and ensures consistent security across the application.

## Features

✅ **Type-safe**: No more `any` types in authentication/authorization code
✅ **DRY**: Reusable higher-order functions
✅ **Secure**: Proper ownership verification for restaurants and reservations
✅ **Consistent**: Standardized error responses across all endpoints

## Core Middleware Functions

Located in `src/lib/api-middleware.ts`:

### 1. `withAuth(handler)`

Ensures the user is authenticated before accessing the endpoint.

```typescript
export const GET = withAuth(async (req, session, context) => {
  // session is guaranteed to exist and have user.email
  // Your authenticated logic here
});
```

### 2. `withRole(role, handler)`

Ensures the user has a specific role (OWNER or CLIENT).

```typescript
export const POST = withRole("OWNER", async (req, session, context) => {
  // User is guaranteed to have OWNER role
});
```

### 3. `withOwner(handler)`

Shorthand for `withRole("OWNER", handler)`.

```typescript
export const POST = withOwner(async (req, session, context) => {
  // User is guaranteed to be an OWNER
});
```

### 4. `withRestaurantOwnership(handler)`

Verifies that the authenticated OWNER owns the restaurant specified in `params.id`.

```typescript
export const PUT = withRestaurantOwnership(async (req, session, { params }) => {
  // User owns the restaurant with id = params.id
  await prisma.restaurant.update({
    where: { id: params.id },
    // ...
  });
});
```

### 5. `withReservationAccess(handler)`

Verifies that the user can access a reservation (either created it OR owns the restaurant).

```typescript
export const GET = withReservationAccess(async (req, session, { params }) => {
  // User either created this reservation OR owns the restaurant
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
  });
  return NextResponse.json(reservation);
});
```

## Helper Functions

### Ownership Verification

```typescript
// Verify restaurant ownership by ID
await verifyRestaurantOwnership(restaurantId, userEmail);

// Verify restaurant ownership by slug
await verifyRestaurantOwnershipBySlug(slug, userEmail);

// Verify reservation ownership
await verifyReservationOwnership(reservationId, userEmail);

// Verify restaurant ownership for a reservation
await verifyReservationRestaurantOwnership(reservationId, userEmail);
```

### User Helpers

```typescript
// Get user by email
const user = await getUserByEmail(session.user.email);
```

### Error Responses

Standardized error responses for consistency:

```typescript
ErrorResponses.unauthorized(); // 401
ErrorResponses.forbidden(); // 403
ErrorResponses.notFound("Custom message"); // 404
ErrorResponses.badRequest("Missing fields"); // 400
ErrorResponses.conflict("Resource conflict"); // 409
```

## Refactored API Routes

### ✅ `/api/owner/restaurants` (POST)

- **Before**: Manual session check, role check, null assertion (`owner!.id`)
- **After**: Uses `withOwner()`, type-safe throughout

### ✅ `/api/reservations` (POST)

- **Before**: Manual auth check, `any` type for preorder items
- **After**: Uses `withAuth()`, proper TypeScript interfaces

### ✅ `/api/reservations/[id]` (GET)

- **Before**: Auth check but NO ownership verification
- **After**: Uses `withReservationAccess()` to verify user can access reservation

### ✅ `/api/reservations/[id]/status` (POST)

- **Before**: Manual checks, `any` type cast for status
- **After**: Uses `withOwner()` and `ReservationStatus` type

### ✅ `/api/me/role` (POST)

- **Before**: Manual auth check, no input validation interface
- **After**: Uses `withAuth()`, proper `UpdateRoleBody` interface

### ✅ `/lib/auth.ts`

- **Before**: Multiple `as any` type casts in JWT/session callbacks
- **After**: All `any` types removed, fully type-safe

## Usage Examples

### Creating a Protected Endpoint

```typescript
import { withAuth, ErrorResponses } from "@/lib/api-middleware";

export const POST = withAuth(async (req, session) => {
  const body = await req.json();

  // Your logic here with guaranteed authenticated session

  return NextResponse.json({ success: true });
});
```

### Owner-Only Endpoint

```typescript
import { withOwner } from "@/lib/api-middleware";

export const POST = withOwner(async (req, session) => {
  // Only restaurant owners can access this
  // session.user.role is guaranteed to be "OWNER"
});
```

### Restaurant Ownership Verification

```typescript
import { withRestaurantOwnership } from "@/lib/api-middleware";

export const DELETE = withRestaurantOwnership(async (req, session, { params }) => {
  // User owns restaurant with params.id
  await prisma.restaurant.delete({
    where: { id: params.id }
  });
  return NextResponse.json({ success: true });
});
```

### Custom Authorization Logic

```typescript
import { withAuth, verifyRestaurantOwnership, ErrorResponses } from "@/lib/api-middleware";

export const POST = withAuth(async (req, session) => {
  const { restaurantId } = await req.json();

  const isOwner = await verifyRestaurantOwnership(restaurantId, session.user.email);

  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  // Proceed with logic
});
```

## Type Definitions

```typescript
// Authenticated session type (guaranteed to have email)
type AuthenticatedSession = Session & {
  user: {
    email: string;
    role?: UserRole | null;
  };
};

// Handler types
type ApiHandler<T = unknown> = (
  req: NextRequest,
  context: { params: T }
) => Promise<NextResponse>;

type AuthenticatedApiHandler<T = unknown> = (
  req: NextRequest,
  session: AuthenticatedSession,
  context: { params: T }
) => Promise<NextResponse>;
```

## Security Benefits

1. **No unauthorized access**: Every protected endpoint requires authentication
2. **Role-based access control**: Owners can only modify their own restaurants
3. **Reservation privacy**: Users can only see their own reservations (unless they're the restaurant owner)
4. **Type safety**: Compile-time checks prevent common security bugs
5. **Consistent error handling**: Standardized error messages across the API

## Migration Checklist

When adding new API routes:

- [ ] Use appropriate middleware (`withAuth`, `withOwner`, etc.)
- [ ] Define TypeScript interfaces for request bodies
- [ ] Use `ErrorResponses` helpers instead of inline `NextResponse.json()`
- [ ] Verify ownership when modifying resources
- [ ] Never use `any` type

## Testing

All API endpoints have been tested and verified to:
- ✅ Require authentication
- ✅ Enforce role-based access control
- ✅ Verify resource ownership
- ✅ Return proper error codes
- ✅ Compile without TypeScript errors
