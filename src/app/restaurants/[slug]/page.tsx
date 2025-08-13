import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import ReserveForm from "./reserve-form";

export default async function RestaurantPage({
  params,
}: {
  params: { slug: string };
}) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug },
    include: {
      categories: {
        include: {
          items: { where: { isAvailable: true }, orderBy: { name: "asc" } },
        },
        orderBy: { sort: "asc" },
      },
      tables: { orderBy: { capacity: "asc" } },
    },
  });

  if (!restaurant)
    return <div className="p-6">Nie znaleziono restauracji.</div>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {restaurant.imageUrl && (
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-56 object-cover rounded-2xl"
        />
      )}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-sm text-muted-foreground">
            {restaurant.description}
          </p>
        )}
      </div>

      <ReserveForm restaurant={restaurant} />

      <section className="grid sm:grid-cols-2 gap-6">
        {restaurant.categories.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <h2 className="text-lg font-semibold">{cat.name}</h2>
            <ul className="space-y-1">
              {cat.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{it.name}</div>
                    {it.description && (
                      <div className="text-xs text-muted-foreground">
                        {it.description}
                      </div>
                    )}
                  </div>
                  <div className="text-sm">{money(it.priceCents)}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
