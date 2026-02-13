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
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Panel właściciela
          </h1>
          <p className="text-sm text-gray-600">
            Zarządzaj swoją restauracją
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-lg">{restaurant.name}</div>
              <div className="text-xs text-gray-500">/{restaurant.slug}</div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="hover:shadow-md transition-shadow">
                <Link href={`/restaurants/${restaurant.slug}`}>Podgląd</Link>
              </Button>
              <Button asChild variant="secondary" className="hover:shadow-md transition-shadow">
                <Link href={`/owner/${restaurant.slug}/menu`}>
                  Menu
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow">
                <Link href={`/owner/${restaurant.slug}/reservations`}>
                  Rezerwacje
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
