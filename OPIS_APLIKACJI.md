# Opis Aplikacji - System Rezerwacji Restauracji

## Spis treści

1. [Przegląd projektu](#przegląd-projektu)
2. [Stos technologiczny](#stos-technologiczny)
3. [Architektura aplikacji](#architektura-aplikacji)
4. [Struktura katalogów](#struktura-katalogów)
5. [Baza danych](#baza-danych)
6. [Uwierzytelnianie i autoryzacja](#uwierzytelnianie-i-autoryzacja)
7. [API Routes](#api-routes)
8. [Mechanizm pollingu](#mechanizm-pollingu)
9. [Zarządzanie slotami czasowymi](#zarządzanie-slotami-czasowymi)
10. [System pre-orderów](#system-pre-orderów)
11. [Komponenty UI](#komponenty-ui)
12. [Przepływy użytkownika](#przepływy-użytkownika)

---

## Przegląd projektu

System rezerwacji restauracji to aplikacja webowa umożliwiająca:

- **Właścicielom restauracji** zarządzanie lokalem, menu, stolikami i rezerwacjami
- **Klientom** przeglądanie restauracji, dokonywanie rezerwacji, zamawianie z góry dań i zarządzanie swoimi rezerwacjami

Główne funkcjonalności:
- Aktualizacje w czasie rzeczywistym poprzez polling
- Zapobieganie podwójnym rezerwacjom
- Zarządzanie slotami czasowymi
- System pre-orderów z menu

---

## Stos technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| **Framework** | Next.js (App Router, Turbopack) | 15.4.6 |
| **Język** | TypeScript (strict mode) | 5.x |
| **UI** | React (Server + Client Components) | 19.1.0 |
| **Baza danych** | SQLite | - |
| **ORM** | Prisma | 6.14.0 |
| **Autoryzacja** | NextAuth.js (Auth.js) - magic links | 4.24.11 |
| **Email** | Resend (mock w dev) | - |
| **Stylowanie** | Tailwind CSS | 4.x |
| **Komponenty** | shadcn/ui | - |
| **Powiadomienia** | Sonner (toasty) | - |
| **Ikony** | Lucide React | - |
| **Walidacja** | Zod | 4.0.17 |

---

## Architektura aplikacji

### Next.js App Router

Aplikacja korzysta z **App Router** wprowadzonego w Next.js 13+. Główne cechy:

- **Routing oparty na katalogach** - każdy folder w `src/app/` reprezentuje segment URL
- **Layouts** - współdzielone layouty między stronami (`layout.tsx`)
- **Server Components** - domyślnie wszystkie komponenty są renderowane na serwerze
- **Client Components** - oznaczane dyrektywą `"use client"` na górze pliku

### Server Components vs Client Components

**Server Components** (renderowane na serwerze):
- Pobieranie danych z bazy (Prisma)
- Sprawdzanie sesji/autoryzacji
- Layouty i strony statyczne

```typescript
// Przykład: src/app/owner/page.tsx
export default async function OwnerDashboard() {
  const session = await auth();
  const restaurant = await prisma.restaurant.findFirst({...});
  return <div>...</div>;
}
```

**Client Components** (renderowane w przeglądarce):
- Interaktywne formularze
- Zarządzanie stanem (useState, useEffect)
- Obsługa zdarzeń użytkownika
- Polling i aktualizacje w czasie rzeczywistym

```typescript
// Przykład: src/app/restaurants/[slug]/reserve-form.tsx
"use client";

export function ReserveForm() {
  const [date, setDate] = useState("");
  // ...interaktywna logika
}
```

### React 19

Aplikacja wykorzystuje React 19 z następującymi funkcjami:
- **Concurrent rendering** - płynniejsze aktualizacje UI
- **Server Components** - natywne wsparcie dla komponentów serwerowych
- **Suspense** - obsługa ładowania asynchronicznego

### Tailwind CSS

Stylowanie oparte na klasach utility:

```tsx
<div className="bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
    Zarezerwuj
  </button>
</div>
```

Konfiguracja w `tailwind.config.ts` definiuje:
- Niestandardowe animacje
- Rozszerzenia kolorów
- Ścieżki do plików źródłowych

---

## Struktura katalogów

```
restaurant-reserve/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Endpointy API (18 tras)
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   ├── me/                   # Endpointy użytkownika
│   │   │   │   ├── profile/          # Aktualizacja profilu
│   │   │   │   ├── reservations/     # Rezerwacje użytkownika
│   │   │   │   ├── restaurant/       # Restauracja właściciela
│   │   │   │   └── role/             # Ustawianie roli
│   │   │   ├── owner/                # Endpointy właściciela
│   │   │   │   └── restaurants/      # Zarządzanie restauracją
│   │   │   ├── reservations/         # CRUD rezerwacji
│   │   │   └── restaurants/          # Publiczne dane restauracji
│   │   ├── auth/                     # Strony autoryzacji
│   │   ├── client/                   # Panel klienta
│   │   ├── login/                    # Strona logowania
│   │   ├── onboarding/               # Wybór roli
│   │   ├── owner/                    # Panel właściciela
│   │   │   ├── [slug]/               # Zarządzanie restauracją
│   │   │   │   ├── edit/             # Edycja restauracji
│   │   │   │   ├── menu/             # Zarządzanie menu
│   │   │   │   └── reservations/     # Lista rezerwacji
│   │   │   └── new-restaurant/       # Tworzenie restauracji
│   │   ├── reservations/             # Szczegóły rezerwacji klienta
│   │   └── restaurants/              # Przeglądanie restauracji
│   │       └── [slug]/               # Szczegóły i formularz rezerwacji
│   │
│   ├── components/
│   │   ├── ui/                       # Komponenty shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── tabs.tsx
│   │   ├── BackToHomeButton.tsx
│   │   ├── RefreshIndicator.tsx      # Wskaźnik pollingu
│   │   ├── ReservationStatusBadge.tsx
│   │   └── UserMenu.tsx
│   │
│   ├── hooks/
│   │   └── usePolling.ts             # Hook do pollingu (30s)
│   │
│   ├── lib/
│   │   ├── auth.ts                   # Konfiguracja NextAuth
│   │   ├── api-middleware.ts         # Guardy i helpery API
│   │   ├── format.ts                 # Funkcje formatujące
│   │   ├── prisma.ts                 # Singleton Prisma
│   │   └── utils.ts                  # Utility Tailwind
│   │
│   ├── types/
│   │   ├── roles.ts                  # Typy ról użytkownika
│   │   └── next-auth.d.ts            # Rozszerzenia typów NextAuth
│   │
│   └── middleware.ts                 # Middleware routingu
│
├── prisma/
│   ├── schema.prisma                 # Schemat bazy danych
│   └── dev.db                        # Baza SQLite (development)
│
├── public/                           # Statyczne assety
├── scripts/                          # Skrypty seedowania
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Baza danych

### Prisma ORM

Prisma to type-safe ORM dla Node.js/TypeScript. Konfiguracja w `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Modele danych

#### User (Użytkownik)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          UserRole?
  restaurant    Restaurant?
  reservations  Reservation[]
  accounts      Account[]
  sessions      Session[]
}

enum UserRole {
  OWNER
  CLIENT
}
```

#### Restaurant (Restauracja)
```prisma
model Restaurant {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  description  String?
  ownerId      String   @unique
  owner        User     @relation(fields: [ownerId], references: [id])
  tables       Table[]
  reservations Reservation[]
  openingHours OpeningHour[]
  timeSlots    TimeSlot[]
  menuCategories MenuCategory[]
}
```

#### Table (Stolik)
```prisma
model Table {
  id           String   @id @default(cuid())
  name         String
  capacity     Int
  restaurantId String
  restaurant   Restaurant @relation(...)
  reservations Reservation[]
}
```

#### Reservation (Rezerwacja)
```prisma
model Reservation {
  id           String   @id @default(cuid())
  startTime    DateTime
  endTime      DateTime
  partySize    Int
  status       ReservationStatus @default(PENDING)
  notes        String?
  guestName    String?
  guestEmail   String?
  guestPhone   String?
  restaurantId String
  tableId      String?
  userId       String?
  preorderItems PreorderItem[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  CANCELLED_BY_CLIENT
  EDITED
}
```

#### TimeSlot (Slot czasowy)
```prisma
model TimeSlot {
  id              String   @id @default(cuid())
  startMinutes    Int      // Minuty od otwarcia
  durationMinutes Int      // Czas trwania slotu
  restaurantId    String
  restaurant      Restaurant @relation(...)
}
```

#### Menu (Kategorie i pozycje)
```prisma
model MenuCategory {
  id           String   @id @default(cuid())
  name         String
  sortOrder    Int      @default(0)
  restaurantId String
  items        MenuItem[]
}

model MenuItem {
  id          String   @id @default(cuid())
  name        String
  description String?
  priceCents  Int      // Cena w groszach
  isAvailable Boolean  @default(true)
  categoryId  String
  preorderItems PreorderItem[]
}

model PreorderItem {
  id            String   @id @default(cuid())
  quantity      Int
  reservationId String
  menuItemId    String
}
```

### Relacje między modelami

```
User (1) ──owns──> (1) Restaurant
Restaurant (1) ──has many──> (n) Tables
Restaurant (1) ──has many──> (n) Reservations
Restaurant (1) ──has many──> (n) TimeSlots
Restaurant (1) ──has many──> (n) OpeningHours
Restaurant (1) ──has many──> (n) MenuCategories
MenuCategory (1) ──has many──> (n) MenuItems
Reservation (n) ──has many──> (n) PreorderItems
```

---

## Uwierzytelnianie i autoryzacja

### NextAuth.js (Auth.js)

Konfiguracja w `src/lib/auth.ts`:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 dni
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Synchronizacja roli z bazy do tokenu
    },
    session({ session, token }) {
      // Dodanie ID i roli do sesji
    },
  },
});
```

### Magic Links

1. Użytkownik wpisuje email na stronie `/login`
2. System wysyła email z linkiem weryfikacyjnym
3. Kliknięcie linku loguje użytkownika
4. W trybie development link jest logowany do konsoli

### Role użytkowników

```typescript
// src/types/roles.ts
export const USER_ROLES = {
  OWNER: "OWNER",
  CLIENT: "CLIENT",
} as const;

export type UserRole = "OWNER" | "CLIENT";
```

### Middleware routingu

`src/middleware.ts` chroni trasy i zarządza przekierowaniami:

```typescript
export default auth((req) => {
  const { auth: session, nextUrl } = req;

  // Chronione ścieżki
  if (nextUrl.pathname.startsWith("/owner") ||
      nextUrl.pathname.startsWith("/onboarding")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    // Wymuszenie onboardingu dla użytkowników bez roli
    if (!session.user.role && !nextUrl.pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }
  }
});
```

### API Middleware

`src/lib/api-middleware.ts` dostarcza Higher-Order Functions do ochrony API:

```typescript
// Wymaga uwierzytelnienia
export function withAuth(handler) {...}

// Wymaga roli OWNER
export function withOwner(handler) {...}

// Wymaga konkretnej roli
export function withRole(role: UserRole) {...}

// Weryfikuje własność restauracji
export function withRestaurantOwnership(handler) {...}

// Weryfikuje dostęp do rezerwacji (właściciel lub klient)
export function withReservationAccess(handler) {...}
```

---

## API Routes

### Struktura endpointów

#### Publiczne (bez autoryzacji)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/restaurants` | Lista restauracji |
| GET | `/api/restaurants/[slug]/available-slots` | Dostępne sloty |

#### Użytkownik (wymaga logowania)
| Metoda | Endpoint | Opis |
|--------|----------|------|
| PATCH | `/api/me/profile` | Aktualizacja profilu |
| GET | `/api/me/reservations` | Rezerwacje użytkownika |
| POST | `/api/me/role` | Ustawienie roli |
| GET | `/api/me/restaurant` | Restauracja właściciela |

#### Rezerwacje
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/reservations` | Tworzenie rezerwacji |
| GET | `/api/reservations/[id]` | Szczegóły rezerwacji |
| PATCH | `/api/reservations/[id]` | Edycja rezerwacji |
| POST | `/api/reservations/[id]/status` | Zmiana statusu (OWNER) |
| POST | `/api/reservations/[id]/cancel` | Anulowanie |

#### Właściciel
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/owner/restaurants` | Tworzenie restauracji |
| GET/PATCH | `/api/owner/restaurants/[slug]` | Zarządzanie restauracją |
| GET | `/api/owner/[slug]/reservations` | Rezerwacje restauracji |
| GET | `/api/owner/restaurants/[slug]/menu` | Menu restauracji |
| POST | `/api/owner/restaurants/[slug]/menu/categories` | Nowa kategoria |
| POST/PATCH | `/api/owner/restaurants/[slug]/menu/items` | Pozycje menu |

### Obsługa błędów

API zwraca JSON z odpowiednimi kodami HTTP:

```typescript
// src/lib/api-middleware.ts
export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export const notFound = (message = "Not found") =>
  NextResponse.json({ error: message }, { status: 404 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export const conflict = (message: string) =>
  NextResponse.json({ error: message }, { status: 409 });
```

---

## Mechanizm pollingu

### Hook usePolling

`src/hooks/usePolling.ts` implementuje polling do aktualizacji w czasie rzeczywistym:

```typescript
interface UsePollingOptions {
  interval?: number;        // Domyślnie: 30000ms (30 sekund)
  enabled?: boolean;        // Włączenie/wyłączenie
  onRefresh?: () => void;   // Callback przy odświeżeniu
}

interface UsePollingReturn {
  isRefreshing: boolean;    // Czy trwa odświeżanie
  lastRefresh: Date;        // Czas ostatniego odświeżenia
  refresh: () => Promise<void>; // Ręczne odświeżenie
}

export function usePolling(options: UsePollingOptions): UsePollingReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (!options.enabled) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await options.onRefresh?.();
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, options.interval ?? 30000);

    return () => clearInterval(interval);
  }, [options.enabled, options.interval]);

  // ...
}
```

### Użycie w komponentach

```typescript
// src/app/client/page.tsx
"use client";

export default function ClientDashboard() {
  const [reservations, setReservations] = useState([]);

  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: true,
    onRefresh: async () => {
      const res = await fetch("/api/me/reservations");
      const data = await res.json();
      setReservations(data);
    },
  });

  return (
    <div>
      <RefreshIndicator
        isRefreshing={isRefreshing}
        lastRefresh={lastRefresh}
        onRefresh={refresh}
      />
      {/* ...lista rezerwacji */}
    </div>
  );
}
```

### Komponent RefreshIndicator

Wyświetla status pollingu:

```typescript
// src/components/RefreshIndicator.tsx
export function RefreshIndicator({ isRefreshing, lastRefresh, onRefresh }) {
  return (
    <div className="flex items-center gap-2">
      {isRefreshing ? (
        <Loader2 className="animate-spin" />
      ) : (
        <span>Odświeżono {formatTimeAgo(lastRefresh)}</span>
      )}
      <button onClick={onRefresh}>Odśwież</button>
    </div>
  );
}
```

---

## Zarządzanie slotami czasowymi

### Struktura slotów

Każdy slot czasowy definiuje:
- `startMinutes` - minuty od godziny otwarcia restauracji
- `durationMinutes` - czas trwania slotu (np. 90 minut)

### Algorytm dostępności slotów

`/api/restaurants/[slug]/available-slots`:

```typescript
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const partySize = parseInt(searchParams.get("partySize") || "2");

  // 1. Pobierz restaurację z relacjami
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug },
    include: {
      openingHours: true,
      timeSlots: true,
      tables: true,
      reservations: {
        where: {
          startTime: { gte: startOfDay, lt: endOfDay },
          status: "CONFIRMED", // Tylko potwierdzone blokują
        },
      },
    },
  });

  // 2. Znajdź godziny otwarcia dla dnia tygodnia
  const dayOfWeek = new Date(date).getDay();
  const openingHour = restaurant.openingHours.find(
    (h) => h.dayOfWeek === dayOfWeek
  );

  // 3. Dla każdego slotu sprawdź dostępność
  const availableSlots = restaurant.timeSlots.map((slot) => {
    // Oblicz absolutny czas rozpoczęcia
    const slotStart = addMinutes(openingTime, slot.startMinutes);
    const slotEnd = addMinutes(slotStart, slot.durationMinutes);

    // Znajdź stoliki z wystarczającą pojemnością
    const suitableTables = restaurant.tables.filter(
      (t) => t.capacity >= partySize
    );

    // Sprawdź czy którykolwiek stolik jest wolny
    const hasAvailableTable = suitableTables.some((table) => {
      const tableReservations = restaurant.reservations.filter(
        (r) => r.tableId === table.id
      );

      // Sprawdź konflikt czasowy
      return !tableReservations.some((r) =>
        hasOverlap(slotStart, slotEnd, r.startTime, r.endTime)
      );
    });

    return {
      ...slot,
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: hasAvailableTable,
    };
  });

  return NextResponse.json(availableSlots);
}
```

### Detekcja konfliktów

```typescript
// Dwie rezerwacje kolidują gdy:
// start1 < end2 AND end1 > start2
function hasOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}
```

### Tworzenie rezerwacji

`POST /api/reservations`:

```typescript
export async function POST(request) {
  const body = await request.json();
  const { restaurantId, startTime, endTime, partySize, tableId } = body;

  // 1. Jeśli podano konkretny stolik - sprawdź konflikt
  if (tableId) {
    const conflicts = await prisma.reservation.findMany({
      where: {
        tableId,
        status: "CONFIRMED",
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });
    if (conflicts.length > 0) {
      return conflict("Stolik jest już zarezerwowany w tym czasie");
    }
  }

  // 2. Jeśli nie podano stolika - znajdź wolny
  if (!tableId) {
    const availableTable = await findAvailableTable(
      restaurantId, startTime, endTime, partySize
    );
    if (!availableTable) {
      return conflict("Brak wolnych stolików");
    }
    tableId = availableTable.id;
  }

  // 3. Utwórz rezerwację
  const reservation = await prisma.reservation.create({
    data: {
      restaurantId,
      tableId,
      startTime,
      endTime,
      partySize,
      status: "PENDING",
      // ...pozostałe dane
    },
  });

  return NextResponse.json(reservation);
}
```

### Wybór wielu slotów

Klient może wybrać 1-2 kolejne sloty dla dłuższego pobytu:

```typescript
// src/app/restaurants/[slug]/reserve-form.tsx
const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

// Walidacja - tylko kolejne sloty
const canSelectSlot = (slotId: string) => {
  if (selectedSlots.length === 0) return true;
  if (selectedSlots.length >= 2) return false;

  const lastSlot = slots.find(s => s.id === selectedSlots[0]);
  const newSlot = slots.find(s => s.id === slotId);

  // Sprawdź czy sloty są kolejne
  return areConsecutive(lastSlot, newSlot);
};
```

---

## System pre-orderów

### Przepływ zamawiania z góry

1. **Formularz rezerwacji** wyświetla menu restauracji
2. Klient wybiera ilości dla pozycji menu
3. Pre-order jest wysyłany razem z rezerwacją
4. Zapisywane jako `PreorderItem` w bazie

### Struktura danych pre-orderu

```typescript
interface PreorderData {
  menuItemId: string;
  quantity: number;
}

// Wysyłane w POST /api/reservations
{
  restaurantId: "...",
  startTime: "...",
  partySize: 4,
  preorderItems: [
    { menuItemId: "item1", quantity: 2 },
    { menuItemId: "item2", quantity: 1 },
  ]
}
```

### Kalkulacja ceny

```typescript
// src/lib/format.ts
export function money(cents: number): string {
  return (cents / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

// Przykład: money(1900) => "19,00 zł"

// Całkowita wartość pre-orderu
const total = preorderItems.reduce((sum, item) => {
  const menuItem = menu.find(m => m.id === item.menuItemId);
  return sum + (menuItem.priceCents * item.quantity);
}, 0);
```

### Zarządzanie menu przez właściciela

```typescript
// POST /api/owner/restaurants/[slug]/menu/categories
{
  name: "Przystawki",
  sortOrder: 1
}

// POST /api/owner/restaurants/[slug]/menu/items
{
  categoryId: "cat123",
  name: "Bruschetta",
  description: "Z pomidorami i bazylią",
  priceCents: 1800,
  isAvailable: true
}
```

---

## Komponenty UI

### shadcn/ui

Biblioteka komponentów oparta na Radix UI i Tailwind:

```typescript
// src/components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input bg-background...",
        // ...
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);

export function Button({ variant, size, ...props }) {
  return <button className={buttonVariants({ variant, size })} {...props} />;
}
```

### Dostępne komponenty shadcn/ui

| Komponent | Plik | Opis |
|-----------|------|------|
| Button | `button.tsx` | Przycisk z wariantami |
| Card | `card.tsx` | Kontener z nagłówkiem/stopką |
| Dialog | `dialog.tsx` | Modal dialogowy |
| Input | `input.tsx` | Pole tekstowe |
| Label | `label.tsx` | Etykieta formularza |
| Tabs | `tabs.tsx` | Zakładki |

### Niestandardowe komponenty

#### ReservationStatusBadge
```typescript
// Wyświetla status rezerwacji z odpowiednim kolorem
<ReservationStatusBadge status="CONFIRMED" />
// Zielony: CONFIRMED
// Żółty: PENDING
// Czerwony: CANCELLED, CANCELLED_BY_CLIENT
// Bursztynowy: EDITED
```

#### RefreshIndicator
```typescript
// Wskaźnik pollingu z czasem ostatniego odświeżenia
<RefreshIndicator
  isRefreshing={true}
  lastRefresh={new Date()}
  onRefresh={() => fetchData()}
/>
```

---

## Przepływy użytkownika

### Przepływ klienta (CLIENT)

```
/login
   │
   ▼
/onboarding ──wybór CLIENT──> /client
                                  │
                                  ├──> /restaurants (przeglądanie)
                                  │         │
                                  │         ▼
                                  │    /restaurants/[slug] (szczegóły + rezerwacja)
                                  │
                                  ├──> /reservations/[id] (szczegóły rezerwacji)
                                  │
                                  └──> /reservations/[id]/edit (edycja)
```

### Przepływ właściciela (OWNER)

```
/login
   │
   ▼
/onboarding ──wybór OWNER──> /owner/new-restaurant (jeśli brak restauracji)
                                  │
                                  ▼
                              /owner (dashboard)
                                  │
                                  ├──> /owner/[slug]/reservations (zarządzanie)
                                  │         │
                                  │         └──> Zmiana statusu (CONFIRM/CANCEL)
                                  │
                                  ├──> /owner/[slug]/menu (edycja menu)
                                  │
                                  ├──> /owner/[slug]/edit (edycja danych)
                                  │
                                  └──> /restaurants/[slug] (podgląd jako klient)
```

### Statusy rezerwacji

```
PENDING ──właściciel potwierdza──> CONFIRMED
    │                                   │
    │                                   └──właściciel anuluje──> CANCELLED
    │
    └──klient anuluje──> CANCELLED_BY_CLIENT

CONFIRMED ──klient edytuje──> EDITED
```

---

## Funkcje pomocnicze

### Format

```typescript
// src/lib/format.ts

// Formatowanie ceny
money(1900) // "19,00 zł"

// Formatowanie daty
formatDate(new Date()) // "4 maja 2026"

// Formatowanie godziny
formatTime(new Date()) // "18:30"
```

### Utils

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Łączenie klas Tailwind z inteligentnym mergowaniem
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Użycie:
cn("px-4 py-2", isActive && "bg-blue-500", className)
```

---

## Podsumowanie

System rezerwacji restauracji to kompletna aplikacja full-stack wykorzystująca:

- **Next.js 15** z App Router dla nowoczesnego routingu i renderingu
- **React 19** z Server i Client Components dla optymalnej wydajności
- **Prisma + SQLite** dla type-safe operacji bazodanowych
- **NextAuth.js** z magic links dla bezpiecznej autoryzacji
- **Tailwind CSS + shadcn/ui** dla spójnego, responsywnego UI
- **Polling** dla aktualizacji w czasie rzeczywistym bez WebSockets
- **System slotów czasowych** z zapobieganiem podwójnym rezerwacjom
- **Pre-ordering** dla zamawiania dań z góry

Architektura zapewnia separację odpowiedzialności, type safety i skalowalność.
