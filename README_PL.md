# SmartDine (Next.js + Prisma)

Aplikacja FullStack do rezerwacji stolików i przed-zamówień dla restauracji. Użytkownicy logują się przy użyciu "magic link", wybierają rolę (Właściciel lub Klient), a następnie:

- **Właściciele**: tworzą restaurację, zarządzają stolikami/menu, akceptują/odrzucają rezerwacje.
- **Klienci**: przeglądają restauracje i dokonują rezerwacji (z opcjonalnym przed-zamówieniem).

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
git clone git@github.com:PKL-Project/smartdine.git
cd smartdine
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

### 4) Start aplikacji

```bash
npm run dev
```

Odwiedź http://localhost:3000

**Pierwsze logowanie:**

- Zaloguj się swoim e‑mailem (link magiczny przez Resend).
- Zostaniesz przeniesiony na **/onboarding**, aby wybrać **Owner** lub **Klient**.
- Właściciele trafią na **/owner**; Klienci na **/client**.

**Tryb deweloperski (Link magiczny w konsoli):**

- W trybie deweloperskim (`NODE_ENV=development`), link magiczny **NIE jest wysyłany emailem**.
- Zamiast tego, link jest **wyświetlany w terminalu/konsoli** jako klikalny URL.
- Sprawdź output konsoli dla: `🔗 Link logowania (kliknij aby się zalogować)`
- Po prostu kliknij link (lub skopiuj/wklej) aby zalogować się natychmiastowo.

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

### Zresetuj bazę (drop & recreate)

```bash
npx prisma migrate reset
```

- Odtwarza bazę i **automatycznie uruchamia seed**.

---

## Skrypty

### Rozwój aplikacji

- `npm run dev` — uruchomienie Next.js w trybie dev
- `npm run build` — build produkcyjny
- `npm start` — start serwera produkcyjnego

### Zarządzanie bazą danych

- `npx prisma studio` — otwórz Prisma Studio (UI bazy danych)
- `npx prisma migrate dev --name <nazwa>` — utwórz nową migrację
- `npx prisma generate` — regeneruj klienta Prisma
- `npx prisma migrate reset` — usuń i odtwórz bazę (uruchamia seed)
- `npm run db:clear` — wyczyść wszystkie dane z bazy

### Skrypty szybkiej konfiguracji

#### Seedowanie wielu restauracji (Zalecane)

Tworzy 5 zróżnicowanych restauracji z realistycznymi menu, różnymi godzinami i kuchniami:

```bash
npm run seed:all
```

**Co tworzy:**

1. **Bella Italia** (Włoska) - owner1@example.com
   - Pn-Sob, 12:00-23:00, sloty 90-min
   - Menu: Antipasti, Pasta, Pizza, Dolci

2. **Sushi Master** (Japońska) - owner2@example.com
   - Codziennie, 13:00-22:00, sloty 60-min
   - Menu: Maki, Nigiri, Sashimi, Dodatki

3. **Burgerholic** (Amerykańska) - owner3@example.com
   - Codziennie, 11:00-23:00, sloty 60-min
   - Menu: Burgery Classic i Premium, Dodatki, Napoje

4. **Green Garden** (Wegańska) - owner4@example.com
   - Tylko Pn-Pt, 9:00-20:00, sloty 90-min (ze śniadaniami)
   - Menu: Śniadania, Bowls, Dania główne, Napoje

5. **Steakhouse Premium** (Fine Dining) - owner5@example.com
   - Tylko Wt-Sob, 17:00-23:00, sloty 120-min (tylko kolacje)
   - Menu: Przystawki, Steki Premium, Dodatki, Wina

Każda restauracja zawiera:

- Konto właściciela (owner1-5@example.com)
- 6 stolików (różne pojemności)
- Realistyczne godziny otwarcia i sloty czasowe
- Kompletne menu z 3-4 kategoriami i 3-8 pozycjami w kategorii
- Wszystkie pozycje z polskimi opisami i cenami

#### Utwórz pojedynczą restaurację z kontem właściciela

Tworzy w pełni skonfigurowaną restaurację z menu, godzinami otwarcia i slotami czasowymi:

```bash
npm run seed:restaurant "Nazwa Restauracji" wlasciciel@example.com
```

**Co tworzy:**

- Konto właściciela z podanym adresem email
- Restauracja o podanej nazwie (slug generowany automatycznie)
- 6 stolików (3x 2-osobowe, 2x 4-osobowe, 1x 6-osobowy)
- Godziny otwarcia: Poniedziałek-Niedziela, 10:00-22:00
- 8 slotów czasowych po 90 minut (10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00, 20:30)
- Pełne menu z 4 kategoriami:
  - Przystawki - 3 pozycje
  - Dania główne - 4 pozycje
  - Desery - 3 pozycje
  - Napoje - 4 pozycje

**Przykład:**

```bash
npm run seed:restaurant "Bistro Aurora" wlasciciel@restauracja.com
```

Skrypt wyświetla slug restauracji oraz adresy URL dla panelu klienta i właściciela.

#### Utwórz konto klienta

Tworzy konto użytkownika klienta:

```bash
npm run create:client klient@example.com
```

**Co tworzy:**

- Konto klienta z podanym adresem email
- Gotowe do natychmiastowego dokonywania rezerwacji

**Przykład:**

```bash
npm run create:client jan@example.com
```

---

## Role i dostęp

- Przy pierwszym logowaniu użytkownik wybiera rolę:
  - **Owner**: dostęp do `/owner` (tworzenie/zarządzanie restauracją, obsługa rezerwacji).
  - **Klient**: przeglądanie `/client` (widok restauracji i rezerwacji), dokonywanie rezerwacji.
- Middleware ogranicza `/owner/**` do roli `OWNER` i wymusza onboarding, jeśli rola nie jest ustawiona.

---

## Rozwiązywanie problemów

- **"Module not found: Can't resolve 'nodemailer'"**
  Email provider Auth.js importuje `nodemailer` nawet jeśli wysyłasz przez Resend. Zainstaluj go aby zaspokoić import:

  ```bash
  npm i nodemailer
  ```

  (Alternatywnie, użyj własnego providera, który wywołuje Resend bezpośrednio.)

- **Link magiczny nie dociera (Produkcja)**
  - Sprawdź `RESEND_API_KEY` i `EMAIL_FROM`.
  - Zweryfikuj domenę wysyłającą w Resend.
  - Dla lokalnego dev, rozważ tryb testowy Resend lub catch-all inbox.

- **Link magiczny w trybie deweloperskim**
  - W trybie dev, emaile **NIE są wysyłane** przez Resend.
  - Link magiczny pojawia się w twoim **terminalu/konsoli**.
  - Szukaj klikalnego linku po wysłaniu emaila na stronie logowania.

---

## Struktura folderów

- `src/app` — trasy Next.js App Router (`/client`, `/owner`, API pod `/api/**`)
- `src/lib` — klient Prisma, konfiguracja Auth, helpery
- `prisma/schema.prisma` — schemat bazy
