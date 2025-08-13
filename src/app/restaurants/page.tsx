import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
    },
  });

  return (
    <main className="max-w-4xl mx-auto p-6 grid sm:grid-cols-2 gap-6">
      {restaurants.map((r) => (
        <Card key={r.id} className="overflow-hidden rounded-2xl">
          {r.imageUrl && (
            <img
              src={r.imageUrl}
              alt={r.name}
              className="w-full h-40 object-cover"
            />
          )}
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold">{r.name}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {r.description}
            </p>
            <Button asChild className="mt-2">
              <Link href={`/restaurants/${r.slug}`}>Zobacz</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
