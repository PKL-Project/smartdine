# SmartDine (Next.js + Prisma)

Full-stack reservation & preorder app for restaurants. Users can sign in with magic links, choose a role (Owner or Client), and then:

- **Owners**: create a restaurant, manage tables/menu, accept/decline reservations.
- **Clients**: browse restaurants and make reservations (with optional pre-order).

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Auth.js (NextAuth) — Email magic links via Resend
- Prisma ORM + SQLite (dev)

---

## Prerequisites

- **Node 20+** (recommended Node 20 LTS)
- **nvm** installed (recommended)
  The repo includes an **`.nvmrc`**. From the project root:

  ```bash
  nvm use    # switches to the correct Node version
  ```

  If you don’t use nvm, ensure `node -v` shows **v20.x** or newer.

- **Resend account** (for magic-link email) with a verified sending domain (or use Resend’s test mode).
- **npm** (comes with Node).

---

## Quick Start

### 1) Clone + install

```bash
git clone git@github.com:PKL-Project/smartdine.git
cd smartdine
nvm use                 # optional but recommended
npm install
```

### 2) Environment variables

Create `.env.local` in the project root (you can also commit an `.env.example`):

```env
# Prisma
DATABASE_URL="file:./dev.db"

# NextAuth / Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-string"

# Resend
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="auth@your-verified-domain.com"
```

> Make sure the `EMAIL_FROM` domain is verified in Resend.

### 3) Database (Prisma + SQLite)

Run initial migration (creates `prisma/dev.db`) and generate the Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

### 4) Start the app

```bash
npm run dev
```

Visit http://localhost:3000

**First login flow:**

- Sign in with your email (magic link via Resend).
- You'll be taken to **/onboarding** to choose **Owner** or **Client**.
- Owners land on **/owner**; Clients go to **/client**.

**Development Mode (Magic Link in Console):**

- In development mode (`NODE_ENV=development`), the magic link email is **not actually sent**.
- Instead, the link is **displayed in your terminal/console** with a clickable URL.
- Check your console output for: `🔗 Link logowania (kliknij aby się zalogować)`
- Simply click the link (or copy/paste it) to sign in instantly.

---

## Cheatsheet (Prisma & DB)

### Change the schema (add/modify models)

1. **Create a migration** (also updates SQLite):
   ```bash
   npx prisma migrate dev --name <your_change>
   ```
2. **Regenerate Prisma Client** (TypeScript types):
   ```bash
   npx prisma generate
   ```
   > `migrate dev` usually triggers `generate`, but running both is a safe habit during development.

### Open Prisma Studio

```bash
npx prisma studio
```

```bash
npx prisma migrate reset
```

- Recreates the database and **automatically runs the seed**.

---

## Scripts

### Development

- `npm run dev` — start Next.js in dev mode
- `npm run build` — production build
- `npm start` — start production server

### Database Management

- `npx prisma studio` — open Prisma Studio (DB UI)
- `npx prisma migrate dev --name <name>` — create a new migration
- `npx prisma generate` — regenerate Prisma client
- `npx prisma migrate reset` — drop & recreate DB (runs seed)
- `npm run db:clear` — clear all data from database

### Quick Setup Scripts

#### Seed Multiple Restaurants (Recommended)

Creates 5 diverse restaurants with realistic menus, varied hours, and different cuisines:

```bash
npm run seed:all
```

**What it creates:**

1. **Bella Italia** (Italian) - owner1@example.com
   - Mon-Sat, 12:00-23:00, 90-min slots
   - Menu: Antipasti, Pasta, Pizza, Dolci

2. **Sushi Master** (Japanese) - owner2@example.com
   - Every day, 13:00-22:00, 60-min slots
   - Menu: Maki, Nigiri, Sashimi, Sides

3. **Burgerholic** (American) - owner3@example.com
   - Every day, 11:00-23:00, 60-min slots
   - Menu: Classic & Premium Burgers, Sides, Drinks

4. **Green Garden** (Vegan) - owner4@example.com
   - Mon-Fri only, 9:00-20:00, 90-min slots (includes breakfast)
   - Menu: Breakfast, Bowls, Main Dishes, Drinks

5. **Steakhouse Premium** (Fine Dining) - owner5@example.com
   - Tue-Sat only, 17:00-23:00, 120-min slots (dinner only)
   - Menu: Appetizers, Premium Steaks, Sides, Wines

Each restaurant includes:

- Owner account (owner1-5@example.com)
- 6 tables (varying capacities)
- Realistic opening hours and time slots
- Complete menus with 3-4 categories and 3-8 items per category
- All items with Polish descriptions and pricing

#### Create a Single Restaurant with Owner Account

Creates a fully configured restaurant with menu, opening hours, and time slots:

```bash
npm run seed:restaurant "Restaurant Name" owner@example.com
```

**What it creates:**

- Owner account with the specified email
- Restaurant with the given name (slug is auto-generated)
- 6 tables (3x 2-person, 2x 4-person, 1x 6-person)
- Opening hours: Monday-Sunday, 10:00-22:00
- 8 time slots of 90 minutes each (10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30)
- Full menu with 4 categories:
  - Przystawki (appetizers) - 3 items
  - Dania główne (main dishes) - 4 items
  - Desery (desserts) - 3 items
  - Napoje (beverages) - 4 items

**Example:**

```bash
npm run seed:restaurant "Bistro Aurora" owner@restaurant.com
```

The script outputs the restaurant slug and URLs for both client and owner panels.

#### Create a Client Account

Creates a client user account:

```bash
npm run create:client client@example.com
```

**What it creates:**

- Client account with the specified email
- Ready to make reservations immediately

**Example:**

```bash
npm run create:client john@example.com
```

---

## Roles & Access

- On first login, users choose a role:
  - **Owner**: access `/owner` (create/manage restaurant, manage reservations).
  - **Client**: browse `/client` (view restaurants and reservations), make reservations.
- The middleware restricts `/owner/**` to users with role `OWNER` and forces onboarding if no role is set.

---

## Troubleshooting

- **“Module not found: Can't resolve 'nodemailer'”**
  Auth.js’s email provider imports `nodemailer` even if you send via Resend. Install it to satisfy the import:

  ```bash
  npm i nodemailer
  ```

  (Alternatively, use a custom provider that calls Resend directly.)

- **Magic link not arriving (Production)**
  - Check `RESEND_API_KEY` and `EMAIL_FROM`.
  - Verify sending domain in Resend.
  - For local dev, consider Resend test mode or a catch-all inbox.

- **Magic link in development mode**
  - In dev mode, emails are **NOT sent** via Resend.
  - The magic link appears in your **console/terminal** output.
  - Look for the clickable link after you submit your email on the login page.

---

## Folder Highlights

- `src/app` — Next.js App Router routes (`/restaurants`, `/owner`, API routes under `/api/**`)
- `src/lib` — Prisma client, Auth config, helpers
- `prisma/schema.prisma` — database schema
