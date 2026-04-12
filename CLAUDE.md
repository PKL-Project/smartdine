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

## Important Considerations

1. **Always validate on backend** - Frontend validation is for UX, backend for security
2. **Use shadcn components** - Don't create custom implementations, for toast use `sonner` library
3. **Polling for updates** - Use throughout for real-time feel, use existing `usePolling` hook
4. **Error handling** - JSON responses, toast notifications, no redirects
5. **Type safety** - Full TypeScript coverage, strict mode
6. **Accessibility** - Proper semantic HTML, ARIA labels where needed
