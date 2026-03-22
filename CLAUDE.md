# Restaurant Reservation System

## Project Overview

This is a **restaurant reservation system** built with Next.js that allows:
- **Restaurant owners** to manage their restaurants, menus, tables, and reservations
- **Clients** to browse restaurants, make reservations, pre-order menu items, and manage their bookings

The system features real-time updates via polling, double-booking prevention, time slot management, and a full menu pre-ordering system.

## Tech Stack

- **Next.js 15.4.6** with App Router and Turbopack
- **TypeScript** - strict type checking throughout
- **React 19.1.0** - Server and Client Components
- **Prisma ORM** - database management with SQLite
- **NextAuth.js (Auth.js)** - authentication with magic links
- **Tailwind CSS** - utility-first styling
- **shadcn/ui** - component library (use when available)
- **Sonner** - toast notifications

## Important: UI Components

**Always use shadcn/ui components when available** instead of creating custom implementations:
- Dialog/Modal: Use `@/components/ui/dialog`
- Buttons: Use `@/components/ui/button`
- Cards: Use `@/components/ui/card`
- Tabs: Use `@/components/ui/tabs`
- Toast notifications: Use `sonner` library

## Key Features

### Authentication & Authorization
- Magic link authentication (passwordless)
- Two user roles: `OWNER` and `CLIENT`
- Role-based access control via middleware
- Session management with NextAuth.js

### Restaurant Management (Owner)
- Create and manage restaurants
- Define menu categories and items with pricing
- Configure tables with capacity
- Set opening hours (by weekday)
- Define time slots for reservations
- View and manage all reservations
- Accept/reject/cancel reservations
- Owner preview mode - see restaurant as clients see it

### Reservations (Client)
- Browse available restaurants
- Select time slots based on restaurant hours
- Choose table based on party size
- Pre-order menu items
- View upcoming and past reservations
- Edit reservations (creates EDITED status)
- Cancel reservations (24-hour rule enforced)

### Real-time Updates
- Polling mechanism via `usePolling` hook
- Auto-refresh reservation lists
- Visual refresh indicator
- Configurable polling intervals

### Double-booking Prevention
- Backend validation on reservation confirmation
- Overlap detection algorithm: `start < confEnd && end > confStart`
- Table availability checking
- Conflict error handling with toast notifications

## Database Schema

### Core Models

**User**
- Supports both OWNER and CLIENT roles
- Auth.js integration (accounts, sessions)
- Relations: restaurants (as owner), reservations (as client)

**Restaurant**
- Owned by a User
- Has: tables, menu categories, opening hours, time slots
- Slug-based URLs for SEO

**Reservation**
- Links: user, restaurant, table (optional)
- Statuses: PENDING, CONFIRMED, CANCELLED, CANCELLED_BY_CLIENT, EDITED
- Duration-based (default 90 minutes)
- Pre-order items attached

**MenuItem**
- Belongs to MenuCategory
- Price in cents (avoid floating point issues)
- Can be pre-ordered with reservations

### Reservation Statuses

1. **PENDING** - New reservation awaiting owner approval
2. **CONFIRMED** - Owner accepted the reservation
3. **CANCELLED** - Owner cancelled the reservation
4. **CANCELLED_BY_CLIENT** - Client cancelled (within 24h window)
5. **EDITED** - Client modified reservation, awaiting re-approval

## Architectural Patterns

### API Routes with Middleware

Use middleware pattern for auth and access control:

```typescript
// Example: src/lib/api-middleware.ts
export const withReservationAccess = (handler) => async (req, session, context) => {
  // Validate session
  // Check permissions
  // Call handler
};
```

### Client/Server Component Split

- **Server Components**: Data fetching, initial render
- **Client Components**: Interactivity, polling, forms
- Mark with `"use client"` directive when needed

### Polling Pattern

```typescript
const { isRefreshing, refresh } = usePolling({
  enabled: true,
  onRefresh: fetchData,
});
```

Use throughout the app for real-time updates without WebSockets.

### Error Handling

- **API Routes**: Return JSON with error messages, not redirects
- **Frontend**: Display errors via Sonner toast notifications
- **Validation**: Both frontend and backend validation

### Price Handling

Store prices in cents (integers) to avoid floating point issues:

```typescript
priceCents: number; // e.g., 1250 = 12.50 zł

const formatPrice = (priceCents: number) => {
  return (priceCents / 100).toFixed(2) + " zł";
};
```

## Important Business Rules

### Reservation Cancellation (24-hour rule)
- Clients can cancel up to 24 hours before reservation time
- Both frontend and backend enforce this rule
- Button disabled (not hidden) when cancellation not allowed
- Creates CANCELLED_BY_CLIENT status (distinct from owner cancellation)

### Double-booking Prevention
- Backend validates on every confirmation
- Checks all CONFIRMED reservations for overlap
- Accounts for full reservation duration
- Returns conflict error with toast notification

### Time Slot Management
- Restaurant defines available time slots
- Slots based on opening hours + slot duration
- Default slot duration: 90 minutes
- Clients can only book within defined slots

### Owner Preview Mode
- Owners can view their restaurant as clients see it
- Visual banner indicates preview mode
- Reservation form disabled (but visible)
- Helps owners verify client experience

## File Structure

```
/src
  /app
    /api
      /reservations/[id]
        /status - Accept/reject reservations
        /cancel - Client cancellation
        route.ts - Get reservation details
    /owner/[slug]
      /reservations - List view with tabs
      /reservations/[id] - Detail view
    /client - Client dashboard
    /restaurants/[slug] - Restaurant public page
    /reservations/[id] - Client reservation view
  /components
    /ui - shadcn components
    ReservationStatusBadge.tsx
    RefreshIndicator.tsx
  /lib
    api-middleware.ts - Auth and access control
    prisma.ts - Prisma client
  /hooks
    usePolling.ts - Real-time updates

/prisma
  schema.prisma - Database schema

/scripts
  seedRestaurant.js - Create test restaurant
  createClient.js - Create test client
  clearDatabase.js - Clear all data
```

## Development Scripts

```bash
# Database management
npm run db:clear              # Clear all database data
npm run db:seed:restaurant "Restaurant Name" "owner@example.com"
npm run db:seed:client "client@example.com"

# Development
npm run dev                   # Start dev server with Turbopack
npm run build                 # Build for production

# Database
npx prisma migrate dev        # Run migrations
npx prisma db push            # Push schema changes
npx prisma studio             # Visual database editor
```

## Common Patterns

### Fetching with Polling

```typescript
const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState(true);

const fetchData = useCallback(async () => {
  const res = await fetch('/api/...');
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  setData(json);
}, []);

useEffect(() => { fetchData(); }, [fetchData]);

const { isRefreshing, refresh } = usePolling({
  enabled: true,
  onRefresh: fetchData,
});
```

### Toast Notifications

```typescript
import { toast } from "sonner";

// Success
toast.success("Rezerwacja została anulowana");

// Error
toast.error("Nie można anulować rezerwacji");
```

### Shadcn Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={handleAction}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### API Error Responses

```typescript
import { ErrorResponses } from "@/lib/api-middleware";

// Usage in API routes
if (!reservation) {
  return ErrorResponses.notFound("Reservation not found");
}

if (hasConflict) {
  return ErrorResponses.conflict("Stolik jest już zarezerwowany");
}

return NextResponse.json({ success: true });
```

## Styling Guidelines

- Use Tailwind utility classes
- Gradient backgrounds: `bg-gradient-to-br from-orange-50 via-white to-amber-50`
- Accent colors: orange-600, amber-600
- Card styling: `rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg`
- Responsive: mobile-first approach

## Important Considerations

1. **Always validate on backend** - Frontend validation is for UX, backend for security
2. **Use shadcn components** - Don't create custom implementations
3. **Price in cents** - Store as integers, display formatted
4. **24-hour cancellation rule** - Enforce on both frontend and backend
5. **Polling for updates** - Use throughout for real-time feel
6. **Error handling** - JSON responses, toast notifications, no redirects
7. **Type safety** - Full TypeScript coverage, strict mode
8. **Accessibility** - Proper semantic HTML, ARIA labels where needed

## Testing Workflow

1. Run `npm run db:clear` to start fresh
2. Run `npm run db:seed:restaurant "Test Restaurant" "owner@test.com"`
3. Run `npm run db:seed:client "client@test.com"`
4. Use magic link emails to sign in
5. Test owner and client flows separately

## Known Patterns to Follow

- **Reservation overlap**: `start < confEnd && end > confStart`
- **24-hour check**: `(reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24`
- **Status badges**: Use `ReservationStatusBadge` component
- **Tabs**: Next/Past split for reservation lists
- **Owner preview**: Visual banner + disabled form
- **Price totals**: Calculate client-side, show before submission
