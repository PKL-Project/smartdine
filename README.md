This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Cheatsheet

Run prisma migration

```
npx prisma migrate dev --name <name-here>
```

Resend:

https://resend.com/domains/efa946cc-4763-4396-a2be-f8474a67c726

Open prisma studio:

```
npx prisma studio
```

After changing your schema.prisma you always need to:

    Run a migration (so SQLite updates its schema)

    Regenerate the Prisma Client (so TypeScript knows about the new models)

For your case:

# 1) Save the DB changes (creates migration SQL & updates SQLite)

npx prisma migrate dev --name app_models

# 2) Regenerate the Prisma Client

npx prisma generate

Reset the db:

```
npx prisma migrate reset
```
