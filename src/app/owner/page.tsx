import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OwnerHome() {
  const session = await getServerSession(authOptions);

  console.log("patryk session", session);
  const email = session?.user?.email!;
  const me = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      restaurants: { select: { id: true, name: true, slug: true } },
    },
  });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel właściciela</h1>
        <Button asChild>
          <Link href="/owner/new-restaurant">Dodaj restaurację</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {me?.restaurants.length ? (
          me.restaurants.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">/{r.slug}</div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/restaurants/${r.slug}`}>Podgląd</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/owner/${r.slug}/reservations`}>
                      Rezerwacje
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Brak restauracji — dodaj pierwszą.
          </p>
        )}
      </div>
    </main>
  );
}
