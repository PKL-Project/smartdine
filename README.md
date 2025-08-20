# Restaurant Reserve (Next.js + Prisma)

Full-stack reservation & preorder app for restaurants. Users can sign in with magic links, choose a role (Owner or Diner), and then:
- **Owners**: create a restaurant, manage tables/menu (WIP), accept/decline reservations.
- **Diners**: browse restaurants and make reservations (with optional pre-order).

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Auth.js (NextAuth) — Email magic links via Resend
- Prisma ORM + SQLite (dev)
- Polling (no websockets)

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
git clone <your-repo-url> restaurant-reserve
cd restaurant-reserve
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
npx prisma migrate dev --name init_app
npx prisma generate
```

### 4) Seed (demo data + owner)
The seed script creates a demo owner and a sample restaurant.
```bash
npx prisma db seed
```
- The owner email is defined at the top of `prisma/seed.js` (default: `owner@example.com`).
- Sign in with that email to access `/owner`.

### 5) Start the app
```bash
npm run dev
```
Visit http://localhost:3000

**First login flow:**
- Sign in with your email (magic link via Resend).
- You’ll be taken to **/onboarding** to choose **Owner** or **Diner**.
- Owners land on **/owner**; Diners go to **/restaurants**.

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

### Seed the DB
```bash
npx prisma db seed
```
- Runs the script defined in `package.json` → `"prisma": { "seed": "node prisma/seed.js" }`.
- The seed **creates/updates** the demo owner (role `OWNER`) and assigns `ownerId` to the sample restaurant.

### Reset the DB (drops & recreates)
```bash
npx prisma migrate reset
```
- Recreates the database and **automatically runs the seed**.

---

## Scripts

- `npm run dev` — start Next.js in dev mode
- `npm run build` — production build
- `npm start` — start production server
- `npx prisma studio` — DB UI
- `npx prisma migrate dev --name <name>` — add migration
- `npx prisma generate` — regenerate client
- `npx prisma migrate reset` — drop & recreate DB (runs seed)
- `npx prisma db seed` — run seeding only

---

## Roles & Access

- On first login, users choose a role:
  - **Owner**: access `/owner` (create/manage restaurant, manage reservations).
  - **Diner**: browse `/restaurants`, open a restaurant page, and reserve.
- The middleware restricts `/owner/**` to users with role `OWNER` and forces onboarding if no role is set.

---

## Troubleshooting

- **“Module not found: Can't resolve 'nodemailer'”**
  Auth.js’s email provider imports `nodemailer` even if you send via Resend. Install it to satisfy the import:
  ```bash
  npm i nodemailer
  ```
  (Alternatively, use a custom provider that calls Resend directly.)

- **Magic link not arriving**
  - Check `RESEND_API_KEY` and `EMAIL_FROM`.
  - Verify sending domain in Resend.
  - For local dev, consider Resend test mode or a catch-all inbox.

---

## Folder Highlights

- `src/app` — Next.js App Router routes (`/restaurants`, `/owner`, API routes under `/api/**`)
- `src/lib` — Prisma client, Auth config, helpers
- `prisma/schema.prisma` — database schema
- `prisma/seed.js` — demo owner + restaurant seeding
