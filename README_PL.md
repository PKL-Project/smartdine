# Restaurant Reserve (Next.js + Prisma)

Aplikacja FullStack do rezerwacji stolików i przed-zamówień dla restauracji. Użytkownicy logują się przy użyciu "magic link", wybierają rolę (Właściciel lub Gość), a następnie:
- **Właściciele**: tworzą restaurację, zarządzają stolikami/menu, akceptują/odrzucają rezerwacje.
- **Goście**: przeglądają restauracje i dokonują rezerwacji (z opcjonalnym przed-zamówieniem).

## Technologie
- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Auth.js (NextAuth) — logowanie e‑mailem z linkiem magicznym przez Resend
- Prisma ORM + SQLite (dev)

---

## Wymagania

- **Node 20+** (zalecana wersja LTS 20)
- Zalecane: **nvm**
  Repo zawiera **`.nvmrc`**. W katalogu głównym projektu:
  ```bash
  nvm use    # przełącza na właściwą wersję Node
  ```
  Jeśli nie używasz nvm, upewnij się, że `node -v` pokazuje **v20.x** lub nowszą.

- **Konto Resend** (do wysyłki linku magicznego) ze zweryfikowaną domeną nadawcy (lub tryb testowy).
- **npm** (dostarczany z Node).

---

## Szybki start

### 1) Klonowanie + instalacja
```bash
git clone git@github.com:PKL-Project/pkl-restaurant.git
cd restaurant-reserve
nvm use                 # opcjonalnie, ale zalecane
npm install
```

### 2) Zmienne środowiskowe
Utwórz plik `.env.local` w katalogu głównym (możesz też dodać do repo plik `.env.example`):

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

> Upewnij się, że domena w `EMAIL_FROM` jest zweryfikowana w Resend.

### 3) Baza danych (Prisma + SQLite)
Uruchom początkową migrację (utworzy `prisma/dev.db`) i wygeneruj klienta Prisma:
```bash
npx prisma migrate dev
npx prisma generate
```

### 4) Seed (dane demo + właściciel)
Skrypt seed tworzy konto demo właściciela i przykładową restaurację.
```bash
npx prisma db seed
```
- E‑mail właściciela jest zdefiniowany na górze pliku `prisma/seed.js` (domyślnie: `owner@example.com`).
- Zaloguj się tym adresem, aby wejść do `/owner`.

### 5) Start aplikacji
```bash
npm run dev
```
Odwiedź http://localhost:3000

**Pierwsze logowanie:**
- Zaloguj się swoim e‑mailem (link magiczny przez Resend).
- Zostaniesz przeniesiony na **/onboarding**, aby wybrać **Owner** lub **Diner**.
- Właściciele trafią na **/owner**; Goście na **/restaurants**.

---

## Ściąga (Prisma & DB)

### Zmiany w schemacie (dodawanie/modyfikacja modeli)
1. **Utwórz migrację** (aktualizuje też SQLite):
   ```bash
   npx prisma migrate dev --name <twoja_zmiana>
   ```
2. **Wygeneruj ponownie Prisma Client** (typy TypeScript):
   ```bash
   npx prisma generate
   ```
> `migrate dev` zwykle uruchamia też `generate`, ale w trakcie developmentu bezpiecznie jest odpalić oba polecenia.

### Otwórz Prisma Studio
```bash
npx prisma studio
```

### Wykonaj seed
```bash
npx prisma db seed
```
- Uruchamia skrypt z `package.json` → `"prisma": { "seed": "node prisma/seed.js" }`.
- Seed **tworzy/aktualizuje** konto demo właściciela (rola `OWNER`) i przypisuje `ownerId` do przykładowej restauracji.

### Zresetuj bazę (drop & recreate)
```bash
npx prisma migrate reset
```
- Odtwarza bazę i **automatycznie uruchamia seed**.

---

## Skrypty

- `npm run dev` — uruchomienie Next.js w trybie dev
- `npm run build` — build produkcyjny
- `npm start` — start serwera produkcyjnego
- `npx prisma studio` — UI bazy danych
- `npx prisma migrate dev --name <nazwa>` — dodanie migracji
- `npx prisma generate` — regeneracja klienta
- `npx prisma migrate reset` — drop & recreate (uruchamia seed)
- `npx prisma db seed` — tylko seed

---

## Role i dostęp

- Przy pierwszym logowaniu użytkownik wybiera rolę:
  - **Owner**: dostęp do `/owner` (tworzenie/zarządzanie restauracją, obsługa rezerwacji).
  - **Diner**: przeglądanie `/restaurants`, strona restauracji i rezerwacja.
- Middleware ogranicza `/owner/**` do roli `OWNER` i wymusza onboarding, jeśli rola nie jest ustawiona.

---

## Struktura folderów

- `src/app` — trasy App Router ( `/restaurants`, `/owner`, API pod `/api/**` )
- `src/lib` — klient Prisma, konfiguracja Auth, helpery
- `prisma/schema.prisma` — schemat bazy
- `prisma/seed.js` — seed: właściciel demo + przykładowa restauracja
