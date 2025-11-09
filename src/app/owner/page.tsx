import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function OwnerHome() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email!;
  const me = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      restaurants: { select: { id: true, name: true, slug: true } },
    },
  });

  // If owner has no restaurant, redirect to create one
  if (!me?.restaurants.length) {
    redirect("/owner/new-restaurant");
  }

  // Get the single restaurant (we know it exists from the check above)
  const restaurant = me.restaurants[0];

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Panel właściciela</h1>
        <p className="text-sm text-muted-foreground">
          Zarządzaj swoją restauracją
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{restaurant.name}</div>
            <div className="text-xs text-muted-foreground">/{restaurant.slug}</div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href={`/restaurants/${restaurant.slug}`}>Podgląd</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/owner/${restaurant.slug}/menu`}>
                Menu
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/owner/${restaurant.slug}/reservations`}>
                Rezerwacje
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
